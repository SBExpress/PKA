"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function FeederScheduleReference() {
  const scheduleData = [
    { amps: 20, copper: "1×3#12", copperConduit: '3/4"', aluminum: "—", aluminumConduit: "—" },
    { amps: 30, copper: "1×3#10", copperConduit: '3/4"', aluminum: "—", aluminumConduit: "—" },
    { amps: 40, copper: "1×3#8", copperConduit: '1"', aluminum: "—", aluminumConduit: "—" },
    { amps: 45, copper: "1×3#6", copperConduit: '1"', aluminum: "—", aluminumConduit: "—" },
    { amps: 50, copper: "1×3#6", copperConduit: '1"', aluminum: "—", aluminumConduit: "—" },
    { amps: 60, copper: "1×3#4", copperConduit: '1-1/4"', aluminum: "—", aluminumConduit: "—" },
    { amps: 70, copper: "1×3#4", copperConduit: '1-1/4"', aluminum: "—", aluminumConduit: "—" },
    { amps: 80, copper: "1×3#3", copperConduit: '1-1/4"', aluminum: "—", aluminumConduit: "—" },
    { amps: 90, copper: "1×3#2", copperConduit: '1-1/4"', aluminum: "—", aluminumConduit: "—" },
    { amps: 100, copper: "1×3#1", copperConduit: '1-1/2"', aluminum: "1×3#1/0", aluminumConduit: '1-1/2"' },
    { amps: 110, copper: "1×3#1", copperConduit: '1-1/2"', aluminum: "1×3#1/0", aluminumConduit: '2"' },
    { amps: 125, copper: "1×3#1", copperConduit: '1-1/2"', aluminum: "1×3#2/0", aluminumConduit: '2"' },
    { amps: 150, copper: "1×3#1/0", copperConduit: '2"', aluminum: "1×3#3/0", aluminumConduit: '2"' },
    { amps: 175, copper: "1×3#2/0", copperConduit: '2"', aluminum: "1×3#4/0", aluminumConduit: '2"' },
    { amps: 200, copper: "1×3#3/0", copperConduit: '2"', aluminum: "1×3#250", aluminumConduit: '2-1/2"' },
    { amps: 225, copper: "1×3#4/0", copperConduit: '2-1/2"', aluminum: "1×3#300", aluminumConduit: '2-1/2"' },
    { amps: 250, copper: "1×3#250", copperConduit: '2-1/2"', aluminum: "1×3#350", aluminumConduit: '2-1/2"' },
    { amps: 300, copper: "1×3#350", copperConduit: '3"', aluminum: "1×3#500", aluminumConduit: '3"' },
    { amps: 350, copper: "1×3#500", copperConduit: '3"', aluminum: "1×3#700", aluminumConduit: '3-1/2"' },
    { amps: 400, copper: "1×3#600", copperConduit: '3-1/2"', aluminum: "2×3#250", aluminumConduit: '3"' },
    { amps: 450, copper: "2×3#4/0", copperConduit: '2"', aluminum: "2×3#300", aluminumConduit: '2-1/2"' },
    { amps: 500, copper: "2×3#250", copperConduit: '2-1/2"', aluminum: "2×3#350", aluminumConduit: '2-1/2"' },
    { amps: 600, copper: "2×3#350", copperConduit: '2-1/2"', aluminum: "2×3#500", aluminumConduit: '3"' },
    { amps: 700, copper: "2×3#500", copperConduit: '3"', aluminum: "2×3#700", aluminumConduit: '3-1/2"' },
    { amps: 800, copper: "2×3#600", copperConduit: '3-1/2"', aluminum: "3×3#400", aluminumConduit: '3"' },
    { amps: 1000, copper: "3×3#400", copperConduit: '3"', aluminum: "3×3#600", aluminumConduit: '3-1/2"' },
    { amps: 1200, copper: "3×3#600", copperConduit: '3-1/2"', aluminum: "4×3#500", aluminumConduit: '3"' },
    { amps: 1600, copper: "4×3#600", copperConduit: '3-1/2"', aluminum: "5×3#600", aluminumConduit: '3-1/2"' },
    { amps: 2000, copper: "5×3#600", copperConduit: '3-1/2"', aluminum: "6×3#600", aluminumConduit: '3-1/2"' },
    { amps: 2500, copper: "6×3#600", copperConduit: '3-1/2"', aluminum: "7×3#700", aluminumConduit: '3-1/2"' },
    { amps: 3000, copper: "8×3#500", copperConduit: '3-1/2"', aluminum: "8×3#700", aluminumConduit: '3-1/2"' },
    { amps: 3500, copper: "9×3#600", copperConduit: '3-1/2"', aluminum: "10×3#700", aluminumConduit: '3-1/2"' },
    { amps: 4000, copper: "10×3#600", copperConduit: '3-1/2"', aluminum: "11×3#700", aluminumConduit: '3-1/2"' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feeder Schedule Reference</CardTitle>
        <CardDescription>
          Industry Standard wire sizes for 3-phase 4-wire systems (Source: Feeder Schedule - Wire Size Chart 2026-06-01)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                <th className="text-left p-2 font-semibold text-gray-900 dark:text-white">Amperage</th>
                <th className="text-left p-2 font-semibold text-gray-900 dark:text-white">Copper</th>
                <th className="text-center p-2 font-semibold text-gray-900 dark:text-white text-xs">Conduit</th>
                <th className="text-left p-2 font-semibold text-gray-900 dark:text-white">Aluminum</th>
                <th className="text-center p-2 font-semibold text-gray-900 dark:text-white text-xs">Conduit</th>
              </tr>
            </thead>
            <tbody>
              {scheduleData.map((row, idx) => (
                <tr key={idx} className={`border-b border-gray-200 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <td className="p-2 font-semibold text-gray-900 dark:text-white">{row.amps}A</td>
                  <td className="p-2 text-gray-700 dark:text-gray-300 font-mono">{row.copper}</td>
                  <td className="p-2 text-gray-700 dark:text-gray-300 text-center text-xs">{row.copperConduit}</td>
                  <td className="p-2 text-gray-700 dark:text-gray-300 font-mono">{row.aluminum}</td>
                  <td className="p-2 text-gray-700 dark:text-gray-300 text-center text-xs">{row.aluminumConduit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Format:</strong> N × 3#SIZE means N sets of 3 conductors of SIZE wire
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Note:</strong> All entries are for 3-phase 4-wire systems in EMT conduit with maximum 100 feet (208V) or 200 feet (480V) run length.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
