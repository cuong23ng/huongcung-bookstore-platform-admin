import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface TopSellingBooksChartProps {
  data: Array<{ bookTitle: string; totalQuantity: number }>;
}

const truncateTitle = (title: string, maxLength: number = 40): string => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
};

export function TopSellingBooksChart({ data }: TopSellingBooksChartProps) {
  // Sort by quantity descending and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10)
    .map(item => ({
      bookTitle: truncateTitle(item.bookTitle),
      totalQuantity: item.totalQuantity,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top sách bán chạy</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" style={{ fontSize: '12px' }} />
              <YAxis 
                type="category" 
                dataKey="bookTitle" 
                width={150}
                style={{ fontSize: '12px' }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString('vi-VN')} cuốn`, 'Số lượng']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar 
                dataKey="totalQuantity" 
                fill="hsl(var(--primary))"
                name="Số lượng bán"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

