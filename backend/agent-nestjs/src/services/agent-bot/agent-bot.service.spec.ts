/**
 * 1) import 区域
 * - 引入被测类 AgentBotService
 * - 引入依赖类型 ConfigService / HttpClientService（用于 mock 注入时的类型转换）
 */
import { ConfigService } from '@nestjs/config';
import { AgentBotService } from './agent-bot.service';
import { HttpClientService } from '../../clients/http-client/http-client.service';

/**
 * 2) describe
 * - Jest 测试分组（测试套件）
 * - 这一组里的 it(...) 都属于 AgentBotService 的测试
 */
describe('AgentBotService', () => {
  /**
   * 3) let 变量
   * - service: 每个用例里真正调用的被测实例
   * - setTimeoutSpy: 用于接管/恢复全局 setTimeout
   */
  let service: AgentBotService;
  let setTimeoutSpy: jest.SpyInstance;

  /**
   * 4) httpClientServiceMock
   * - PostUrl 是一个 jest.fn() mock 函数
   * - jest.fn<ReturnType, ArgsTuple>()：
   *   ReturnType = Promise<unknown>
   *   ArgsTuple = [string, string, Record<string, unknown>, Record<string, string>]
   * - 作用：记录被调用次数、参数，并可指定返回值
   */
  const httpClientServiceMock = {
    PostUrl: jest.fn<Promise<unknown>, [string, string, Record<string, unknown>, Record<string, string>]>(),
  };

  /**
   * 5) configValues + configServiceMock
   * - configValues: 模拟配置中心里的键值
   * - configServiceMock.get(key): 模拟 ConfigService.get(key)
   * - 这样你在测试中可以临时修改 configValues 来模拟“配置缺失”
   */
  const configValues: Record<string, string> = {
    CHATWOOT_BASE_URL: 'http://172.19.210.43:3000',
    CHATWOOT_BOT_API_ACCESS_TOKEN: 'token-123',
    BOT_REPLY_TEXT: 'hello',
  };

  const configServiceMock = {
    get: jest.fn((key: string) => configValues[key]),
  };

  /**
   * 6) beforeEach
   * - 每个 it 执行前都会跑一次，保证用例互不污染
   * - mockReset(): 清调用记录 + 清实现
   * - mockResolvedValue({}): 让 PostUrl 默认 async 成功
   * - mockClear(): 清掉 get 的调用记录
   * - spyOn(global, 'setTimeout'): 劫持 setTimeout，避免真实等待
   * - new AgentBotService(...): 手动注入 mock 依赖
   */
  beforeEach(() => {
    httpClientServiceMock.PostUrl.mockReset();
    // 模拟 LLM 返回结构 (resp.data.answer)
    httpClientServiceMock.PostUrl.mockResolvedValue({ data: { answer: 'hello' } });
    configServiceMock.get.mockClear();

    // 劫持 setTimeout：当 delay === 1000 时立即执行回调以触发 reply；
    // 对于去重 TTL (5min) 则不执行回调，避免马上清理去重记录。
    setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void, ms?: number) => {
      if (ms === 1000) {
        (fn as any)();
      }
      return {} as unknown as NodeJS.Timeout;
    }) as unknown as typeof setTimeout);

    service = new AgentBotService(
      httpClientServiceMock as unknown as HttpClientService,
      configServiceMock as unknown as ConfigService,
    );
  });

  /**
   * 7) afterEach
   * - 每个 it 后恢复 setTimeout，避免影响别的测试文件
   */
  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  /**
   * 8) it: 非目标事件应忽略
   * - Act: 调用 HandleWebhook
   * - Assert: PostUrl 不应被调用
   */
  it('should ignore non message_created incoming event', async () => {
    await service.HandleWebhook({
      id: 10,
      event: 'conversation_updated',
      message_type: 'incoming',
      conversation: { id: 20 },
    });

    expect(httpClientServiceMock.PostUrl).not.toHaveBeenCalled();
  });

  /**
   * 9) it: 缺少 message id 应忽略
   */
  it('should ignore event without message id', async () => {
    await service.HandleWebhook({
      event: 'message_created',
      message_type: 'incoming',
      conversation: { id: 20 },
    });

    expect(httpClientServiceMock.PostUrl).not.toHaveBeenCalled();
  });

  /**
   * 10) it: 重复 message id 只发送一次
   * - 同 payload 调用两次
   * - toHaveBeenCalledTimes(1) 断言去重生效
   */
  it('should ignore duplicate message id', async () => {
    const payload = {
      account: { id: 3, name: 'acct' },
      id: 10,
      event: 'message_created',
      message_type: 'incoming',
      conversation: { id: 20 },
    };

    await service.HandleWebhook(payload);
    await service.HandleWebhook(payload);

    // 第一次调用会触发两次 PostUrl：一次 LLM，一次 Chatwoot
    expect(httpClientServiceMock.PostUrl).toHaveBeenCalledTimes(2);
  });

  /**
   * 11) it: 缺少 conversation.id 应忽略
   */
  it('should ignore event without conversation id', async () => {
    await service.HandleWebhook({
      id: 10,
      event: 'message_created',
      message_type: 'incoming',
    });

    expect(httpClientServiceMock.PostUrl).not.toHaveBeenCalled();
  });

  /**
   * 12) it: 缺少必要配置时不发送
   * - 临时把 token 置空
   * - 断言 PostUrl 不调用
   * - 最后恢复 token，避免影响后续用例
   */
  it('should skip reply when required config is missing', async () => {
    configValues.CHATWOOT_BOT_API_ACCESS_TOKEN = '';

    await service.HandleWebhook({
      account: { id: 3, name: 'acct' },
      id: 10,
      event: 'message_created',
      message_type: 'incoming',
      conversation: { id: 20 },
    });

    // 实现中会先调用 LLM（PostUrl），随后因为缺少 token 而不会调用 Chatwoot 回复接口。
    expect(httpClientServiceMock.PostUrl).toHaveBeenCalled();
    expect(httpClientServiceMock.PostUrl).not.toHaveBeenCalledWith(
      'http://172.19.210.43:3000',
      expect.stringContaining('/api/v1/accounts/'),
      expect.anything(),
      expect.anything(),
    );

    configValues.CHATWOOT_BOT_API_ACCESS_TOKEN = 'token-123';
  });

  /**
   * 13) it: 正常路径应发送请求，且参数正确
   * - toHaveBeenCalledWith(...) 是“严格匹配”
   * - 参数个数、顺序、内容都要一致，否则失败
   */
  it('should post outgoing reply to agent bot api', async () => {
    await service.HandleWebhook({
      account: { id: 3, name: 'acct' },
      id: 10,
      event: 'message_created',
      message_type: 'incoming',
      conversation: { id: 20 },
    });
    expect(httpClientServiceMock.PostUrl).toHaveBeenCalledWith(
      'http://172.19.210.43:3000',
      '/api/v1/accounts/3/conversations/20/messages',
      {
        content: 'hello',
        message_type: 'outgoing',
        private: false,
        content_type: 'text',
      },
      {
        api_access_token: 'token-123',
        'Content-Type': 'application/json',
      },
    );

    // LLM + Chatwoot = 2 次调用
    expect(httpClientServiceMock.PostUrl).toHaveBeenCalledTimes(2);
  });
});
