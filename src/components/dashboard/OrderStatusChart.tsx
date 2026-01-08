import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface OrderStatusChartProps {
  readonly data: Array<{ name: string; value: number }>;
}

const COLORS = [
  'hsl(var(--primary))',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82CA9D',
  '#FFC658',
  '#FF6B6B',
];

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    WAITING_PAYMENT: 'Chờ thanh toán',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đã giao hàng',
    DELIVERED: 'Đã nhận hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return statusMap[status] || status;
};

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  // Filter out statuses with zero count and map to Vietnamese labels
  const chartData = data
    .filter(item => item.value > 0)
    .map(item => ({
      name: getStatusLabel(item.name),
      value: item.value,
      originalStatus: item.name,
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng thái đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => {
                  if (percent < 0.05) return ''; // Don't show label for very small slices
                  return `${name}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} đơn`, 'Số lượng']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend
                formatter={(value, entry: any) => {
                  const percent = total > 0 ? ((entry.payload?.value || 0) / total * 100).toFixed(1) : '0';
                  return `${value} (${percent}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

