import { Box, Flex, Text } from '@radix-ui/themes';
import { Input } from '@repo/ui';
import { BaseControlConfigProps, InputChangeEvent, TextControlConfig } from './types';

type TextConfigProps = BaseControlConfigProps<TextControlConfig>;

export const TextConfig = ({ config, onConfigChange }: TextConfigProps) => {
  const updateConfig = (updates: Partial<TextControlConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <>
      <Box style={{ marginBottom: '16px' }}>
        <Text size="2" weight="bold" style={{ marginBottom: '8px' }}>
          Label *
        </Text>
        <Input
          value={config.label}
          onChange={(e: InputChangeEvent) => updateConfig({ label: e.target.value })}
          placeholder="Enter field label"
          style={{ width: '100%' }}
        />
      </Box>

      <Box style={{ marginBottom: '16px' }}>
        <Text size="2" weight="bold" style={{ marginBottom: '8px' }}>
          Placeholder
        </Text>
        <Input
          value={config.placeholder}
          onChange={(e: InputChangeEvent) => updateConfig({ placeholder: e.target.value })}
          placeholder="Enter placeholder text"
          style={{ width: '100%' }}
        />
      </Box>

      <Box style={{ marginBottom: '16px' }}>
        <Text size="2" weight="bold" style={{ marginBottom: '8px' }}>
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
          style={{ width: '100%' }}
        />
      </Box>

      <Flex gap="4" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={config.multiline}
            onChange={(e) => updateConfig({ multiline: e.target.checked })}
          />
          <Text size="2">Allow multiple lines</Text>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={config.required}
            onChange={(e) => updateConfig({ required: e.target.checked })}
          />
          <Text size="2">Required field</Text>
        </label>
      </Flex>
    </>
  );
};
