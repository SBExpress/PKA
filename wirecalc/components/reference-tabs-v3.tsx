"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  NEC_310_16,
  NEC_250_122,
  NEC_ANNEX_C_EMT,
  NEC_310_15_B_2_ADJUSTMENT,
  COMMON_FEEDER_SIZES,
  CONDUIT_FILL_PERCENTAGES,
} from "@/lib/nec-tables"
import { BookOpen } from "lucide-react"
import { FeederScheduleReference } from "./feeder-schedule-reference"

export function ReferenceTabsV3() {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
          <BookOpen className="h-5 w-5" />
          NEC Reference Tables
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="feeder-schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="feeder-schedule" className="text-xs sm:text-sm">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="quick" className="text-xs sm:text-sm">
              Quick Ref
            </TabsTrigger>
            <TabsTrigger value="310-16" className="text-xs sm:text-sm">
              310.16
            </TabsTrigger>
            <TabsTrigger value="250-122" className="text-xs sm:text-sm">
              250.122
            </TabsTrigger>
            <TabsTrigger value="annex-c" className="text-xs sm:text-sm">
              Annex C
            </TabsTrigger>
            <TabsTrigger value="adjustment" className="text-xs sm:text-sm">
              Adjust
            </TabsTrigger>
          </TabsList>

          {/* Feeder Schedule */}
          <TabsContent value="feeder-schedule">
            <FeederScheduleReference />
          </TabsContent>

          {/* Quick Reference */}
          <TabsContent value="quick" className="space-y-4">
            <div className="text-xs sm:text-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Common Feeder Sizes (75°C)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-indigo-100 dark:bg-indigo-900">
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Amps</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Copper</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Aluminum</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Conduit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMMON_FEEDER_SIZES.map((row) => (
                      <tr key={row.amperage} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-medium">{row.amperage}A</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{row.copper}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{row.aluminum}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{row.conduit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* NEC 310.16 - Ampacities */}
          <TabsContent value="310-16" className="space-y-4">
            <div className="text-xs">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">NEC Table 310.16 - Allowable Ampacities (per NEC 2023)</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">Copper and Aluminum conductors in raceway, cable, or earth</p>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs border-collapse border border-gray-300 dark:border-gray-600">
                  <thead className="sticky top-0 bg-indigo-100 dark:bg-indigo-900">
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Wire Size</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-indigo-700 dark:text-indigo-300">Cu 60°C</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-indigo-700 dark:text-indigo-300">Cu 75°C</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-indigo-700 dark:text-indigo-300">Cu 90°C</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-orange-700 dark:text-orange-300">Al 60°C</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-orange-700 dark:text-orange-300">Al 75°C</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-orange-700 dark:text-orange-300">Al 90°C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NEC_310_16.map((row) => (
                      <tr key={row.wireSize} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-semibold">{row.wireSize}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{row.copper60C}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{row.copper75C}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{row.copper90C}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{row.aluminum60C || "—"}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{row.aluminum75C || "—"}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{row.aluminum90C || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* NEC 250.122 - Grounding */}
          <TabsContent value="250-122" className="space-y-4">
            <div className="text-xs">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">NEC Table 250.122 - Minimum Grounding Conductor Sizes</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">Based on protection device rating</p>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs border-collapse border border-gray-300 dark:border-gray-600">
                  <thead className="sticky top-0 bg-green-100 dark:bg-green-900">
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">OCPD Rating</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-indigo-700 dark:text-indigo-300">Copper GND</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-orange-700 dark:text-orange-300">Aluminum GND</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NEC_250_122.map((row) => (
                      <tr key={row.protectionDeviceRating} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-semibold">{row.protectionDeviceRating}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{row.copperAWG}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{row.aluminumAWG}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Annex C - Conduit Fill */}
          <TabsContent value="annex-c" className="space-y-4">
            <div className="text-xs">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">NEC Annex C - Conduit Fill Tables</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Cross-sectional areas in square inches (EMT)</p>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded mb-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Fill Percentages (Chapter 9, Table 1):</p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
                  <li>1 wire: 53% fill</li>
                  <li>2 wires: 31% fill</li>
                  <li>3 or more: 40% fill</li>
                </ul>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs border-collapse border border-gray-300 dark:border-gray-600">
                  <thead className="sticky top-0 bg-purple-100 dark:bg-purple-900">
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Conduit Size</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">1 Wire</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">2 Wires</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">3+ Wires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NEC_ANNEX_C_EMT.map((row) => (
                      <tr key={row.conduitSize} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-semibold">{row.conduitSize}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{row.oneWire}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{row.twoWires}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{row.threeWires}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Adjustment Factors */}
          <TabsContent value="adjustment" className="space-y-4">
            <div className="text-xs">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">NEC 310.15(B)(2) - Adjustment Factors</h3>

              <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded mb-4 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-2">More Than 3 Conductors in Raceway</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-amber-300 dark:border-amber-700">
                    <thead className="bg-amber-100 dark:bg-amber-900">
                      <tr>
                        <th className="border border-amber-300 dark:border-amber-700 px-2 py-1">Number of Conductors</th>
                        <th className="border border-amber-300 dark:border-amber-700 px-2 py-1">Adjustment Factor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {NEC_310_15_B_2_ADJUSTMENT.map((row) => (
                        <tr key={row.conductorCount} className="hover:bg-amber-100 dark:hover:bg-amber-800">
                          <td className="border border-amber-300 dark:border-amber-700 px-2 py-1">{row.conductorCount}</td>
                          <td className="border border-amber-300 dark:border-amber-700 px-2 py-1 font-semibold">{row.factor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 text-xs space-y-2">
                <p className="font-semibold text-gray-900 dark:text-white">Example:</p>
                <p className="text-gray-700 dark:text-gray-300">
                  If you have 5 conductors in one conduit, the ampacity must be multiplied by 0.8:
                </p>
                <p className="font-mono text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded">
                  Adjusted Ampacity = Base Ampacity × 0.8
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
