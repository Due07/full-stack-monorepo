export const SYSTEM_SETTING_KEYS = {
  PUBLIC_USER_REGISTER_ENABLED: 'public_user_register_enabled',
} as const;

export type TSystemSettingKey = typeof SYSTEM_SETTING_KEYS[keyof typeof SYSTEM_SETTING_KEYS];

type TSystemSettingValueType = 'boolean';

export type TSystemSettingDefinition = {
  defaultValue: string;
  description: string;
  valueType: TSystemSettingValueType;
};

export const SYSTEM_SETTING_DEFINITIONS: Record<TSystemSettingKey, TSystemSettingDefinition> = {
  [SYSTEM_SETTING_KEYS.PUBLIC_USER_REGISTER_ENABLED]: {
    defaultValue: 'false',
    description: '是否开启用户端 H5 注册入口',
    valueType: 'boolean',
  },
};
