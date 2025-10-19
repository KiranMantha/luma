import { Box, Flex, Text } from '@radix-ui/themes';
import { Input } from '@repo/ui';
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
          Toolbar Options
        </Text>
        <Flex gap="2" wrap="wrap">
          {['bold', 'italic', 'underline', 'link', 'bulletList', 'numberedList', 'blockquote'].map((tool) => (
            <label key={tool} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={config.toolbar.includes(tool)}
                onChange={(e) => handleToolbarToggle(tool, e.target.checked)}
              />
              <Text size="2">{tool}</Text>
            </label>
          ))}
        </Flex>
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
