import { Card } from 'antd';
import type { PropsWithChildren, ReactNode } from 'react';

type PageCardProps = PropsWithChildren<{
  title: ReactNode;
  extra?: ReactNode;
  loading?: boolean;
}>;

export default function PageCard({ title, extra, loading, children }: PageCardProps) {
  return (
    <Card title={title} extra={extra} loading={loading} className="shadow-sm">
      {children}
    </Card>
  );
}
