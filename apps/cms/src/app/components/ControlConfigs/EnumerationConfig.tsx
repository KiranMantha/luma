import { Box, Input, Text, Textarea } from '@repo/ui';
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
    <div className="space-y-4">
      <Input
        label="Label *"
        placeholder="Enter field label"
        value={config.label}
        onChange={(e: InputChangeEvent) => updateConfig({ label: e.target.value })}
      />
      <Input
        label="Placeholder"
        placeholder="Select an option..."
        value={config.placeholder}
        onChange={(e: InputChangeEvent) => updateConfig({ placeholder: e.target.value })}
      />

      <Textarea
        label="Options (one per line)"
        defaultValue={config.options.join('\n')}
        rows={4}
        hint="Labels will be displayed as entered. Values will be auto-generated (UPPERCASE_WITH_UNDERSCORES)."
        onChange={(e: TextAreaChangeEvent) => handleOptionsChange(e.target.value)}
      />

      <Box className="mb-4">
        <Text as="label" className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.required}
            onChange={(e) => updateConfig({ required: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Text size="2">Required field</Text>
        </Text>
      </Box>
    </div>
  );
};
