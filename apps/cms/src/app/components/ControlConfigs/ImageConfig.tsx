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
          Allowed File Types
        </Text>
        <Flex className="gap-2 flex-wrap">
          {['jpg', 'png', 'gif', 'webp', 'svg'].map((type) => (
            <label key={type} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={config.allowedTypes.includes(type)}
                onChange={(e) => handleTypeToggle(type, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Text>{type.toUpperCase()}</Text>
            </label>
          ))}
        </Flex>
      </Box>

      <Box className="mb-4">
        <Text weight="bold" className="mb-2 block">
          Max File Size (MB)
        </Text>
        <Input
          type="number"
          value={config.maxSize || ''}
          onChange={(e: InputChangeEvent) => {
            const value = e.target.value;
            updateConfig({ maxSize: value ? parseFloat(value) : undefined });
          }}
          placeholder="Maximum file size in MB"
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
