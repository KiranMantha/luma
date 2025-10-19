import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { Icon, Input } from '@repo/ui';
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
          Table Title
        </Text>
        <Input
          value={config.title}
          onChange={(e: InputChangeEvent) => updateConfig({ title: e.target.value })}
          placeholder="Enter table title"
          style={{ width: '100%' }}
        />
      </Box>

      <Box style={{ marginBottom: '16px' }}>
        <Text size="2" weight="bold" style={{ marginBottom: '8px' }}>
          Table Caption (Optional)
        </Text>
        <Input
          value={config.caption}
          onChange={(e: InputChangeEvent) => updateConfig({ caption: e.target.value })}
          placeholder="Enter table caption"
          style={{ width: '100%' }}
        />
      </Box>

      <Box style={{ marginBottom: '16px' }}>
        <Text size="2" weight="bold" style={{ marginBottom: '8px' }}>
          Table Footnote (Optional)
        </Text>
        <Input
          value={config.footnote}
          onChange={(e: InputChangeEvent) => updateConfig({ footnote: e.target.value })}
          placeholder="Enter table footnote"
          style={{ width: '100%' }}
        />
      </Box>

      <Box style={{ marginBottom: '16px' }}>
        <Flex align="center" justify="between" style={{ marginBottom: '8px' }}>
          <Text size="2" weight="bold">
            Table Headers
          </Text>
          <Button size="1" onClick={addHeader}>
            Add Header
          </Button>
        </Flex>

        {config.headers.map((header, index) => (
          <Box
            key={header.id}
            style={{
              marginBottom: '12px',
              padding: '12px',
              border: '1px solid var(--gray-6)',
              borderRadius: '4px',
            }}
          >
            <Flex gap="2" align="center" style={{ marginBottom: '8px' }}>
              <Box style={{ flex: 1 }}>
                <Text size="1" style={{ marginBottom: '4px' }}>
                  Header Label
                </Text>
                <Input
                  value={header.label}
                  onChange={(e: InputChangeEvent) => updateHeader(index, 'label', e.target.value)}
                  placeholder="Enter header label"
                  style={{ width: '100%' }}
                />
              </Box>
              <Box>
                <Text size="1" style={{ marginBottom: '4px' }}>
                  Type
                </Text>
                <Box>
                  <select
                    value={header.type || 'text'}
                    onChange={(e) => updateHeader(index, 'type', e.target.value)}
                    style={{ padding: '4px', border: '1px solid var(--gray-6)', borderRadius: '4px' }}
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Multiline</option>
                  </select>
                </Box>
              </Box>
              {config.headers.length > 1 && (
                <Button size="1" variant="ghost" color="red" onClick={() => removeHeader(index)}>
                  <Icon name="cross-2" color="red" />
                </Button>
              )}
            </Flex>
          </Box>
        ))}
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
