import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../../clients/http-client/http-client.service';

type TAgentBotWebhookPayload = {
  account: { id: number, name: string };
  id: number;
  event?: string;
  content: string;
  message_type?: string;
  conversation?: {
    id?: number;
    contact_index: {
      pubsub_token: string;
    }
  };
};

@Injectable()
export class AgentBotService {
  private readonly logger = new Logger(AgentBotService.name);
  private readonly processedMessageIds = new Set<number>();
  private readonly dedupTtlMs = 5 * 60 * 1000;

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly configService: ConfigService<TGlobalEnv>,
  ) { }

  /**
   * @param status on: 显示对方正在输入，off: 取消正在输入状态
   */
  async PostMsgStatus(payload: TAgentBotWebhookPayload, status: 'on' | 'off') {
    const location = this.configService.get('CHATWOOT_BASE_URL') ?? '';
    const { account: { id: accountId } = {}, conversation: { id: conversationId } = {} } = payload;
    console.log(location, accountId, conversationId);

    await this.httpClientService.PostUrl(
      location,
      `/api/v1/accounts/${accountId}/conversations/${conversationId}/toggle_typing_status`,
      { typing_status: status },
      {
        api_access_token: this.configService.get('CHATWOOT_BOT_API_ACCESS_TOKEN') ?? '',
        'Content-Type': 'application/json',
      }
    ).catch((e) => console.log(e));
  }

  async PostSendLLM(payload: TAgentBotWebhookPayload) {
    const { conversation: { id } = {}, content } = payload;
    if (!id) return this.logger.warn('Missing conversation id in payload');
    console.log(id, content);
    const resp: any = await this.httpClientService.PostUrl(
      'http://192.168.11.222:18080',
      '/open/chatMessage',
      { 'open_id': `${id}`, content, stream: false },
      {
        Authorization: 'Bearer NmM4YjNkOWU3OWM1ODM5NTUxMTFjODc1MzA3N2UwZDFfVGRZRFdtMEFkU18xNzc1NTQwNjQz'
      }
    ).catch(() => {
      return { data: { answer: 'LLM request failed' } };
    });
    this.logger.log(`LLM resp --- ${JSON.stringify(resp)}`);
    return resp.data.answer;
  }

  public async HandleWebhook(payload: unknown): Promise<void> {
    const eventPayload = payload as TAgentBotWebhookPayload;
    // MVP 只处理用户侧 incoming 的 message_created 事件。
    if (!this.IsIncomingMessageCreated(eventPayload)) {
      this.logger.debug('Ignored non-incoming message_created event');
      return;
    }

    const messageId = eventPayload?.id;
    if (!messageId) {
      this.logger.warn('Ignored event because message.id is missing');
      return;
    }

    if (this.processedMessageIds.has(messageId)) {
      this.logger.log(`Skipped duplicate message id: ${messageId}`);
      return;
    }

    // 基于 message.id 做进程内去重，防止 webhook 重试导致重复回复。
    this.processedMessageIds.add(messageId);
    this.ScheduleDedupCleanup(messageId);

    // 会话ID
    const conversationId = eventPayload.conversation?.id;
    if (!conversationId) {
      this.logger.warn(`Ignored message ${messageId} because conversation id is missing`);
      return;
    }

    // 创建机器人管理者 ID
    const { id: accountId } = eventPayload.account ?? {};
    const accessToken = this.configService.get('CHATWOOT_BOT_API_ACCESS_TOKEN') ?? '';

    this.PostMsgStatus(eventPayload, 'on'); // 显示正在输入状态

    // const replyText = this.configService.get('BOT_REPLY_TEXT') ?? 'Hello from NestJS Agent Bot';
    const replyText = await this.PostSendLLM(eventPayload);
    if (!accountId || !accessToken) {
      this.logger.error('CHATWOOT_ACCOUNT_ID or CHATWOOT_BOT_API_ACCESS_TOKEN is missing');
      return;
    }

    // Chatwoot 回复消息接口：按账号与会话维度回写 outgoing 消息。
    // 注意 conversationId 使用 webhook 的 conversation.id（display_id）。
    const apiPath = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
    const body = {
      content: replyText,
      // message_type: 'outgoing',
      message_type: 'template',
      private: false,
      content_type: 'text',
      content_attributes: {
        in_reply_to: messageId,
      },
    };
    const headers = {
      api_access_token: accessToken,
      'Content-Type': 'application/json',
    };

    try {
      this.PostMsgStatus(eventPayload, 'off'); // 取消正在输入状态

      const location = this.configService.get('CHATWOOT_BASE_URL') ?? '';
      await this.httpClientService.PostUrl(location, apiPath, body, headers);
      this.logger.log(`Replied to incoming message ${messageId} in conversation ${conversationId}`);
    } catch (error) {
      console.log(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to reply for message ${messageId}: ${errorMessage}`);
    }
  }

  private IsIncomingMessageCreated(payload: TAgentBotWebhookPayload): boolean {
    return ['message_created'].includes(payload.event ?? '') && ['incoming'].includes(payload.message_type ?? '');
  }

  private ScheduleDedupCleanup(messageId: number): void {
    // TTL 到期后释放去重记录，控制内存占用并保留短时幂等能力。
    setTimeout(() => {
      this.processedMessageIds.delete(messageId);
    }, this.dedupTtlMs);
  }
}
