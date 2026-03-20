import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Package } from 'lucide-react';

interface AnalyticsData {
  label: string;
  value: number;
}

interface AnalyticsSectionProps {
  title: string;
  subtitle: string;
  data: AnalyticsData[];
  type: 'area' | 'bar';
  color?: string;
  icon?: React.ReactNode;
  formatter?: (value: number) => string;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  title, subtitle, data, type, color = "#10b981", icon, formatter = (v) => v.toString()
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-app-card rounded-2xl border border-app-border p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 bg-app-bg rounded-lg text-emerald-500 border border-app-border">{icon}</div>}
          <div>
            <h3 className="text-lg font-black text-app-text tracking-tight italic">{title}</h3>
            <p className="text-xs text-app-text-muted font-bold tracking-tight">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold border border-green-500/20">
          <TrendingUp className="w-3 h-3" />
          <span>Live Data</span>
        </div>
      </div>

      <div className="h-[300px] w-full mt-4 relative min-w-0">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
            {type === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="currentColor" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'currentColor', opacity: 0.6 }}
                />
                <YAxis 
                  stroke="currentColor" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={formatter}
                  tick={{ fill: 'currentColor', opacity: 0.6 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a2f3a', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    color: '#fff',
                    fontWeight: '900',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                  itemStyle={{ color: color }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={3}
                />
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="currentColor" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'currentColor', opacity: 0.6 }}
                />
                <YAxis 
                  stroke="currentColor" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={formatter}
                  tick={{ fill: 'currentColor', opacity: 0.6 }}
                />
                <Tooltip 
                  cursor={{ fill: 'currentColor', opacity: 0.05 }}
                  contentStyle={{ 
                    backgroundColor: '#1a2f3a', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    color: '#fff',
                    fontWeight: '900',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill={color} 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsSection;
