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
      <Input
        label="Control Name *"
        value={config.label}
        onChange={(e: InputChangeEvent) => updateConfig({ label: e.target.value })}
        placeholder="Enter control name (e.g., content, description)"
        className="w-full"
      />
      <Box>
        <Text as="label" size="2" weight="medium" className="mb-1 block text-gray-700">
          Toolbar Options
        </Text>
        <Flex wrap="wrap" direction="column">
          {['bold', 'italic', 'underline', 'link', 'bulletList', 'numberedList', 'blockquote'].map((tool) => (
            <Text as="label" key={tool} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={config.toolbar.includes(tool)}
                onChange={(e) => handleToolbarToggle(tool, e.target.checked)}
                className="rounded border-gray-300"
              />
              <Text size="2">{tool}</Text>
            </Text>
          ))}
        </Flex>
      </Box>

      <Input
        label="Max Length"
        type="number"
        value={config.maxLength || ''}
        onChange={(e: InputChangeEvent) => {
          const value = e.target.value;
          updateConfig({ maxLength: value ? parseInt(value, 10) : undefined });
        }}
        placeholder="Enter maximum character limit"
        className="w-full"
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
