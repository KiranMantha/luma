import { Box, Flex, Input, Text } from '@repo/ui';
import { BaseControlConfigProps, InputChangeEvent, JsonControlConfig, TextAreaChangeEvent } from './types';

type JsonConfigProps = BaseControlConfigProps<JsonControlConfig>;

export const JsonConfig = ({ config, onConfigChange }: JsonConfigProps) => {
  const updateConfig = (updates: Partial<JsonControlConfig>) => {
    onConfigChange({ ...config, ...updates });
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
          JSON Schema (Optional)
        </Text>
        <textarea
          value={config.schema}
          onChange={(e: TextAreaChangeEvent) => updateConfig({ schema: e.target.value })}
          placeholder="Enter JSON schema for validation"
          className="w-full h-30 p-2 border border-gray-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Text size="1" className="mt-1 block text-gray-600">
          Optional JSON schema to validate user input against
        </Text>
      </Box>

      <Flex className="gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.pretty}
            onChange={(e) => updateConfig({ pretty: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Text>Pretty print JSON</Text>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.required}
            onChange={(e) => updateConfig({ required: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Text>Required field</Text>
        </label>
      </Flex>
    </div>
  );
};
