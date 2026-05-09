import zhCN from 'antd/locale/zh_CN';
import { ConfigProvider, App as AntdApp } from 'antd';
import { PropsWithChildren, useEffect } from 'react';
import 'antd/dist/reset.css';
import '@/styles/global.scss';
import { useAuthStore } from '@/stores/auth';

function AppBootstrap({ children }: PropsWithChildren) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}

export function rootContainer(container: React.ReactNode) {
  return <AppBootstrap>{container}</AppBootstrap>;
}
