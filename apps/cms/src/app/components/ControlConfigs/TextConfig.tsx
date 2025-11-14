import { Flex, Input, Text } from '@repo/ui';
import { BaseControlConfigProps, InputChangeEvent, TextControlConfig } from './types';

type TextConfigProps = BaseControlConfigProps<TextControlConfig>;

export const TextConfig = ({ config, onConfigChange }: TextConfigProps) => {
  const updateConfig = (updates: Partial<TextControlConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Control Name *"
        placeholder="Enter control name (e.g., title, description)"
        value={config.label}
        onChange={(e: InputChangeEvent) => updateConfig({ label: e.target.value })}
      />
      <Input
        label="Placeholder"
        placeholder="Enter placeholder text"
        value={config.placeholder}
        onChange={(e: InputChangeEvent) => updateConfig({ placeholder: e.target.value })}
      />
      <Input
        label="Max Length"
        placeholder="Enter maximum character limit"
        type="number"
        value={config.maxLength || ''}
        onChange={(e: InputChangeEvent) => {
          const value = e.target.value;
          updateConfig({ maxLength: value ? parseInt(value, 10) : undefined });
        }}
      />

      <Flex gap="4" className="flex-wrap">
        <Text as="label" className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.multiline}
            onChange={(e) => updateConfig({ multiline: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Text size="2">Allow multiple lines</Text>
        </Text>
        <Text as="label" className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.required}
            onChange={(e) => updateConfig({ required: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Text size="2">Required field</Text>
        </Text>
      </Flex>
    </div>
  );
};
