import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { history, useSearchParams } from 'umi';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';
import { getErrorMessage } from '@/utils/message';
import styles from './index.module.scss';

type LoginFormValues = {
  account: string;
  password: string;
};

const PASSWORD_RULE_MESSAGE = '密码格式不正确（大小写字母+数字）至少8位';
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/;

export default function LoginPage() {
  const [form] = Form.useForm<LoginFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && accessToken) {
      history.replace(searchParams.get('redirect') || '/');
    }
  }, [accessToken, hydrated, searchParams]);

  const handleSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const result = await login({
        account: values.account.trim(),
        password: values.password,
      });

      setSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });

      messageApi.success('登录成功');
      history.replace(searchParams.get('redirect') || '/');
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${styles.page} flex items-center justify-center px-4`}>
      {contextHolder}
      <Card className={styles.heroCard} bordered={false}>
        <div className="mb-8 text-center">
          <div className={styles.heroTitle}>Liberty 后台系统</div>
          <Typography.Text className={styles.heroSubTitle}></Typography.Text>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            label="账号"
            name="account"
            rules={[
              { required: true, message: '请输入登录账号' },
              { whitespace: true, message: '请输入登录账号' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入 username 或 phone" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { pattern: PASSWORD_RULE, message: PASSWORD_RULE_MESSAGE },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}