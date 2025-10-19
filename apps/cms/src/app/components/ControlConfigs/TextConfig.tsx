import { Box, Flex, Input, Text } from '@repo/ui';
import { BaseControlConfigProps, InputChangeEvent, TextControlConfig } from './types';

type TextConfigProps = BaseControlConfigProps<TextControlConfig>;

export const TextConfig = ({ config, onConfigChange }: TextConfigProps) => {
  const updateConfig = (updates: Partial<TextControlConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4">
      <Box>
        <Text size="2" weight="bold" className="block mb-2">
          Label *
        </Text>
        <Input
          value={config.label}
          onChange={(e: InputChangeEvent) => updateConfig({ label: e.target.value })}
          placeholder="Enter field label"
        />
      </Box>

      <Box>
        <Text size="2" weight="bold" className="block mb-2">
          Placeholder
        </Text>
        <Input
          value={config.placeholder}
          onChange={(e: InputChangeEvent) => updateConfig({ placeholder: e.target.value })}
          placeholder="Enter placeholder text"
        />
      </Box>

      <Box>
        <Text size="2" weight="bold" className="block mb-2">
          Max Length
        </Text>
        <Input
          type="number"
          value={config.maxLength || ''}
          onChange={(e: InputChangeEvent) => {
            const value = e.target.value;
            updateConfig({ maxLength: value ? parseInt(value, 10) : undefined });
          }}
          placeholder="Enter maximum character limit"
        />
      </Box>

      <Flex gap="4" className="flex-wrap">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.multiline}
            onChange={(e) => updateConfig({ multiline: e.target.checked })}
            className="rounded border-gray-300 focus:ring-primary-500"
          />
          <Text size="2">Allow multiple lines</Text>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.required}
            onChange={(e) => updateConfig({ required: e.target.checked })}
            className="rounded border-gray-300 focus:ring-primary-500"
          />
          <Text size="2">Required field</Text>
        </label>
      </Flex>
    </div>
  );
};
