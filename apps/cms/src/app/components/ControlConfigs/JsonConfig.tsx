import { Box, Flex, Text } from '@radix-ui/themes';
import { Input } from '@repo/ui';
import { BaseControlConfigProps, InputChangeEvent, JsonControlConfig, TextAreaChangeEvent } from './types';

type JsonConfigProps = BaseControlConfigProps<JsonControlConfig>;

export const JsonConfig = ({ config, onConfigChange }: JsonConfigProps) => {
  const updateConfig = (updates: Partial<JsonControlConfig>) => {
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
          JSON Schema (Optional)
        </Text>
        <textarea
          value={config.schema}
          onChange={(e: TextAreaChangeEvent) => updateConfig({ schema: e.target.value })}
          placeholder="Enter JSON schema for validation"
          style={{
            width: '100%',
            height: '120px',
            padding: '8px',
            border: '1px solid var(--gray-6)',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        />
        <Text size="1" color="gray" style={{ marginTop: '4px', display: 'block' }}>
          Optional JSON schema to validate user input against
        </Text>
      </Box>

      <Flex gap="4" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={config.pretty} onChange={(e) => updateConfig({ pretty: e.target.checked })} />
          <Text size="2">Pretty print JSON</Text>
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
