import { Box, Button, Flex, Icon, Input, Text } from '@repo/ui';
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
          Table Title
        </Text>
        <Input
          value={config.title}
          onChange={(e: InputChangeEvent) => updateConfig({ title: e.target.value })}
          placeholder="Enter table title"
          className="w-full"
        />
      </Box>

      <Box className="mb-4">
        <Text weight="bold" className="mb-2 block">
          Table Caption (Optional)
        </Text>
        <Input
          value={config.caption}
          onChange={(e: InputChangeEvent) => updateConfig({ caption: e.target.value })}
          placeholder="Enter table caption"
          className="w-full"
        />
      </Box>

      <Box className="mb-4">
        <Text weight="bold" className="mb-2 block">
          Table Footnote (Optional)
        </Text>
        <Input
          value={config.footnote}
          onChange={(e: InputChangeEvent) => updateConfig({ footnote: e.target.value })}
          placeholder="Enter table footnote"
          className="w-full"
        />
      </Box>

      <Box className="mb-4">
        <Flex className="items-center justify-between mb-2">
          <Text weight="bold">Table Headers</Text>
          <Button size="sm" onClick={addHeader}>
            Add Header
          </Button>
        </Flex>

        {config.headers.map((header, index) => (
          <Box key={header.id} className="mb-3 p-3 border border-gray-300 rounded-md">
            <Flex className="gap-2 items-center mb-2">
              <Box className="flex-1">
                <Text size="1" className="mb-1 block">
                  Header Label
                </Text>
                <Input
                  value={header.label}
                  onChange={(e: InputChangeEvent) => updateHeader(index, 'label', e.target.value)}
                  placeholder="Enter header label"
                  className="w-full"
                />
              </Box>
              <Box>
                <Text size="1" className="mb-1 block">
                  Type
                </Text>
                <Box>
                  <select
                    value={header.type || 'text'}
                    onChange={(e) => updateHeader(index, 'type', e.target.value)}
                    className="p-1 border border-gray-300 rounded-md"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Multiline</option>
                  </select>
                </Box>
              </Box>
              {config.headers.length > 1 && (
                <Button size="sm" variant="ghost" color="red" onClick={() => removeHeader(index)}>
                  <Icon name="cross-2" color="red" />
                </Button>
              )}
            </Flex>
          </Box>
        ))}
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
