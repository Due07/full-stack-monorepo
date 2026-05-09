import { Button, Result } from 'antd';
import { history } from 'umi';

export default function NotFoundPage() {
  return (
    <div className="page-container flex items-center justify-center p-6">
      <Result
        status="404"
        title="404"
        subTitle="页面不存在。"
        extra={<Button type="primary" onClick={() => history.push('/')}>返回首页</Button>}
      />
    </div>
  );
}
