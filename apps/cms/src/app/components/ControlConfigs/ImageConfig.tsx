import { Box, Flex, Text } from '@radix-ui/themes';
import { Input } from '@repo/ui';
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
          Allowed File Types
        </Text>
        <Flex gap="2" wrap="wrap">
          {['jpg', 'png', 'gif', 'webp', 'svg'].map((type) => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={config.allowedTypes.includes(type)}
                onChange={(e) => handleTypeToggle(type, e.target.checked)}
              />
              <Text size="2">{type.toUpperCase()}</Text>
            </label>
          ))}
        </Flex>
      </Box>

      <Box style={{ marginBottom: '16px' }}>
        <Text size="2" weight="bold" style={{ marginBottom: '8px' }}>
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
