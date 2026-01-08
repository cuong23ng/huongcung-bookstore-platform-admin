import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format, parseISO } from 'date-fns';

interface OrderTrendChartProps {
  data: Array<{ date: string; count: number }>;
}

const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM');
  } catch {
    return dateString;
  }
};

export function OrderTrendChart({ data }: OrderTrendChartProps) {
  // Sort data by date to ensure proper ordering
  const sortedData = [...data].sort((a, b) => {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sortedData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} đơn`, 'Số lượng']}
                labelFormatter={(label) => `Ngày: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1}
                fill="url(#colorCount)"
                name="Số đơn hàng"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

