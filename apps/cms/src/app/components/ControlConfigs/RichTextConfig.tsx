import { Box, Flex, Input, Text } from '@repo/ui';
import { BaseControlConfigProps, InputChangeEvent, RichTextControlConfig } from './types';

type RichTextConfigProps = BaseControlConfigProps<RichTextControlConfig>;

export const RichTextConfig = ({ config, onConfigChange }: RichTextConfigProps) => {
  const updateConfig = (updates: Partial<RichTextControlConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const handleToolbarToggle = (tool: string, checked: boolean) => {
    const toolbar = checked ? [...config.toolbar, tool] : config.toolbar.filter((t) => t !== tool);
    updateConfig({ toolbar });
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
          Toolbar Options
        </Text>
        <Flex className="gap-2 flex-wrap">
          {['bold', 'italic', 'underline', 'link', 'bulletList', 'numberedList', 'blockquote'].map((tool) => (
            <label key={tool} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={config.toolbar.includes(tool)}
                onChange={(e) => handleToolbarToggle(tool, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Text>{tool}</Text>
            </label>
          ))}
        </Flex>
      </Box>

      <Box className="mb-4">
        <Text weight="bold" className="mb-2 block">
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
          className="w-full"
        />
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
