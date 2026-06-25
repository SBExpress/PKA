import { WireCalculatorV3 } from "@/components/wire-calculator-v3"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Wire & Conduit Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            v3.0 — With NEC Tables & Voltage Drop Optimization
          </p>
        </div>
        <WireCalculatorV3 />

        {/* Footer Link to V2 */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
          <p>
            Using the classic version?{" "}
            <a
              href="https://wirecalc.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              WireCalc V2
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
