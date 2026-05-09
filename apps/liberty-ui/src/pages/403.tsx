import { Button, Result } from 'antd';
import { history } from 'umi';

export default function ForbiddenPage() {
  return (
    <div className="page-container flex items-center justify-center p-6">
      <Result
        status="403"
        title="403"
        subTitle="抱歉，你没有权限访问当前页面。"
        extra={<Button type="primary" onClick={() => history.push('/')}>返回首页</Button>}
      />
    </div>
  );
}
