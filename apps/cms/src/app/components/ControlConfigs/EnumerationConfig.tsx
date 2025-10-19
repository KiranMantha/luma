import { Box, Text } from '@radix-ui/themes';
import { Input } from '@repo/ui';
import { BaseControlConfigProps, EnumerationControlConfig, InputChangeEvent, TextAreaChangeEvent } from './types';

type EnumerationConfigProps = BaseControlConfigProps<EnumerationControlConfig>;

export const EnumerationConfig = ({ config, onConfigChange }: EnumerationConfigProps) => {
  const updateConfig = (updates: Partial<EnumerationControlConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const handleOptionsChange = (optionsText: string) => {
    const options = optionsText.split('\n').filter((option) => option.trim() !== '');
    updateConfig({ options });
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
          placeholder="Select an option..."
          style={{ width: '100%' }}
        />
      </Box>

      <Box style={{ marginBottom: '16px' }}>
        <Text size="2" weight="bold" style={{ marginBottom: '8px' }}>
          Options (one per line)
        </Text>
        <textarea
          value={config.options.join('\n')}
          onChange={(e: TextAreaChangeEvent) => handleOptionsChange(e.target.value)}
          placeholder="Option 1&#10;Option 2&#10;Option 3"
          style={{
            width: '100%',
            height: '120px',
            padding: '8px',
            border: '1px solid var(--gray-6)',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
        <Text size="1" color="gray" style={{ marginTop: '4px', display: 'block' }}>
          Labels will be displayed as entered. Values will be auto-generated (UPPERCASE_WITH_UNDERSCORES).
        </Text>
      </Box>

      <Box style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={config.required}
            onChange={(e) => updateConfig({ required: e.target.checked })}
          />
          <Text size="2">Required field</Text>
        </label>
      </Box>
    </>
  );
};
