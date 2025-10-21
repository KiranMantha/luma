import { Flex, Input, Text, Textarea } from '@repo/ui';
import { BaseControlConfigProps, InputChangeEvent, JsonControlConfig, TextAreaChangeEvent } from './types';

type JsonConfigProps = BaseControlConfigProps<JsonControlConfig>;

export const JsonConfig = ({ config, onConfigChange }: JsonConfigProps) => {
  const updateConfig = (updates: Partial<JsonControlConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Label *"
        value={config.label}
        onChange={(e: InputChangeEvent) => updateConfig({ label: e.target.value })}
        placeholder="Enter field label"
        className="w-full"
      />

      <Textarea
        label="JSON Schema (Optional)"
        value={config.schema}
        hint="Optional JSON schema to validate user input against"
        onChange={(e: TextAreaChangeEvent) => updateConfig({ schema: e.target.value })}
        placeholder="Enter JSON schema for validation"
        className="h-30 w-full rounded-md border border-gray-300 p-2 font-mono text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />

      <Flex className="mb-4 gap-4">
        <Text as="label" className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.pretty}
            onChange={(e) => updateConfig({ pretty: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Text size="2">Pretty print JSON</Text>
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
