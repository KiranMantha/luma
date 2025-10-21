import { Box, Flex, Input, Text } from '@repo/ui';
import { BaseControlConfigProps, ImageControlConfig, InputChangeEvent } from './types';

type ImageConfigProps = BaseControlConfigProps<ImageControlConfig>;

export const ImageConfig = ({ config, onConfigChange }: ImageConfigProps) => {
  const updateConfig = (updates: Partial<ImageControlConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const handleTypeToggle = (type: string, checked: boolean) => {
    const allowedTypes = checked ? [...config.allowedTypes, type] : config.allowedTypes.filter((t) => t !== type);
    updateConfig({ allowedTypes });
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
      <Box>
        <Text as="label" size="2" weight="medium" className="mb-1 block text-gray-700">
          Allowed File Types
        </Text>
        <Flex direction="column">
          {['jpg', 'png', 'gif', 'webp', 'svg'].map((type) => (
            <Text as="label" key={type} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={config.allowedTypes.includes(type)}
                onChange={(e) => handleTypeToggle(type, e.target.checked)}
                className="rounded border-gray-300"
              />
              <Text size="2">{type.toUpperCase()}</Text>
            </Text>
          ))}
        </Flex>
      </Box>

      <Input
        label="Max File Size (MB)"
        type="number"
        value={config.maxSize || ''}
        onChange={(e: InputChangeEvent) => {
          const value = e.target.value;
          updateConfig({ maxSize: value ? parseFloat(value) : undefined });
        }}
        placeholder="Maximum file size in MB"
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
