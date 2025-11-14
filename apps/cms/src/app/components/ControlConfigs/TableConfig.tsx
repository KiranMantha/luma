import { Box, Button, Flex, Icon, Input, Select, Text } from '@repo/ui';
import { BaseControlConfigProps, InputChangeEvent, TableControlConfig } from './types';

type TableConfigProps = BaseControlConfigProps<TableControlConfig>;

export const TableConfig = ({ config, onConfigChange }: TableConfigProps) => {
  const updateConfig = (updates: Partial<TableControlConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const addHeader = () => {
    const newHeader = {
      id: `header-${config.headers.length + 1}`,
      label: `Column ${config.headers.length + 1}`,
      type: 'text' as const,
    };
    updateConfig({ headers: [...config.headers, newHeader] });
  };

  const removeHeader = (index: number) => {
    const headers = config.headers.filter((_, i) => i !== index);
    updateConfig({ headers });
  };

  const updateHeader = (index: number, field: 'label' | 'type', value: string) => {
    const headers = [...config.headers];
    const currentHeader = headers[index];

    if (!currentHeader) return;

    if (field === 'type') {
      headers[index] = {
        id: currentHeader.id,
        label: currentHeader.label,
        type: value as 'text' | 'textarea',
      };
    } else {
      headers[index] = {
        id: currentHeader.id,
        label: value,
        type: currentHeader.type,
      };
    }
    updateConfig({ headers });
  };

  return (
    <div className="space-y-4">
      <Box className="mb-4">
        <Input
          label="Control Name *"
          placeholder="Enter control name (e.g., pricing, features)"
          value={config.label}
          onChange={(e: InputChangeEvent) => updateConfig({ label: e.target.value })}
          className="w-full"
        />
      </Box>

      <Box className="mb-4">
        <Input
          label="Table Caption (Optional)"
          value={config.caption}
          onChange={(e: InputChangeEvent) => updateConfig({ caption: e.target.value })}
          placeholder="Enter table caption"
          className="w-full"
        />
      </Box>

      <Box className="mb-4">
        <Input
          label="Table Footnote (Optional)"
          value={config.footnote}
          onChange={(e: InputChangeEvent) => updateConfig({ footnote: e.target.value })}
          placeholder="Enter table footnote"
          className="w-full"
        />
      </Box>

      <Box className="mb-4">
        <Flex className="mb-2 items-center justify-between">
          <Text as="label" weight="bold">
            Table Headers
          </Text>
          <Button size="sm" onClick={addHeader}>
            Add Header
          </Button>
        </Flex>

        {config.headers.map((header, index) => (
          <Box key={header.id} className="mb-3 rounded-md border border-gray-300 p-3">
            <Flex justify="center" className="mb-2 items-center gap-2">
              <Box className="flex-1">
                <Input
                  label="Header Label"
                  placeholder="Enter header label"
                  value={header.label}
                  onChange={(e: InputChangeEvent) => updateHeader(index, 'label', e.target.value)}
                  className="w-full"
                />
              </Box>
              <Box>
                <Select
                  label="Type"
                  value={header.type || 'text'}
                  options={[
                    { label: 'Text', value: 'text' },
                    { label: 'Multiline', value: 'textarea' },
                  ]}
                  onChange={(e) => updateHeader(index, 'type', e.target.value)}
                />
              </Box>
              {config.headers.length > 1 && (
                <Button size="sm" variant="ghost" color="red" className="mt-5" onClick={() => removeHeader(index)}>
                  <Icon name="cross-2" color="red" />
                </Button>
              )}
            </Flex>
          </Box>
        ))}
      </Box>

      <Box className="mb-4">
        <Text as="label" className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.required}
            onChange={(e) => updateConfig({ required: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Text as="label">Required field</Text>
        </Text>
      </Box>
    </div>
  );
};
