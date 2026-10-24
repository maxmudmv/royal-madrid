'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export interface CompetitionBreakdownRow {
  competition_code: string;
  competition_name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
}

export function SeasonChartsClient({
  data,
}: {
  data: CompetitionBreakdownRow[];
}) {
  if (!data || data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Goals For vs Goals Against by Competition */}
      <div className="rounded border border-[#3B321F] bg-[#111111] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C9A64B]">
          Attacking &amp; Defensive Balance
        </p>
        <h3 className="mt-1 font-serif text-lg font-bold text-[#F1EEE7]">
          Goals Scored vs. Conceded by Competition
        </h3>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#262116" />
              <XAxis
                dataKey="competition_code"
                stroke="#AAA69C"
                tick={{ fill: '#AAA69C', fontSize: 11 }}
              />
              <YAxis
                stroke="#AAA69C"
                tick={{ fill: '#AAA69C', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#080808',
                  borderColor: '#C9A64B',
                  color: '#F1EEE7',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#AAA69C' }} />
              <Bar
                dataKey="goals_for"
                name="RM Goals Scored"
                fill="#C9A64B"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="goals_against"
                name="Goals Conceded"
                fill="#4B463B"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* W / D / L by Competition */}
      <div className="rounded border border-[#3B321F] bg-[#111111] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C9A64B]">
          Competitive Outcomes
        </p>
        <h3 className="mt-1 font-serif text-lg font-bold text-[#F1EEE7]">
          Wins, Draws &amp; Losses by Competition
        </h3>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#262116" />
              <XAxis
                dataKey="competition_code"
                stroke="#AAA69C"
                tick={{ fill: '#AAA69C', fontSize: 11 }}
              />
              <YAxis
                stroke="#AAA69C"
                tick={{ fill: '#AAA69C', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#080808',
                  borderColor: '#C9A64B',
                  color: '#F1EEE7',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#AAA69C' }} />
              <Bar
                dataKey="wins"
                name="Wins (W)"
                stackId="a"
                fill="#6CC070"
              />
              <Bar
                dataKey="draws"
                name="Draws (D)"
                stackId="a"
                fill="#E6D3A0"
              />
              <Bar
                dataKey="losses"
                name="Losses (L)"
                stackId="a"
                fill="#E06C75"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
