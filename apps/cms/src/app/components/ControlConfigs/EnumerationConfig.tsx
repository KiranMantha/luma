import { Box, Input, Text } from '@repo/ui';
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
      <Box className="mb-4">
        <Text weight="bold" className="mb-2 block">
          Label *
        </Text>
        <Input
          value={config.label}
          onChange={(e: InputChangeEvent) => updateConfig({ label: e.target.value })}
          placeholder="Enter field label"
          className="w-full"
        />
      </Box>

      <Box className="mb-4">
        <Text weight="bold" className="mb-2 block">
          Placeholder
        </Text>
        <Input
          value={config.placeholder}
          onChange={(e: InputChangeEvent) => updateConfig({ placeholder: e.target.value })}
          placeholder="Select an option..."
          className="w-full"
        />
      </Box>

      <Box className="mb-4">
        <Text weight="bold" className="mb-2 block">
          Options (one per line)
        </Text>
        <textarea
          value={config.options.join('\n')}
          onChange={(e: TextAreaChangeEvent) => handleOptionsChange(e.target.value)}
          placeholder="Option 1&#10;Option 2&#10;Option 3"
          className="w-full h-30 p-2 border border-gray-300 rounded-md font-inherit text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Text size="1" className="mt-1 block text-gray-600">
          Labels will be displayed as entered. Values will be auto-generated (UPPERCASE_WITH_UNDERSCORES).
        </Text>
      </Box>

      <Box className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.required}
            onChange={(e) => updateConfig({ required: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Text>Required field</Text>
        </label>
      </Box>
    </div>
  );
};
