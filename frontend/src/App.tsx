import { useEffect, useRef, useState } from "react"
import { analyzeRing } from "./api/analyze-api"
import type { Output } from "./types/output"
import { CSVLink } from 'react-csv'
import Papa from 'papaparse'
import type { ParseResult } from 'papaparse'

function App() {
  const [modulus, setModulus] = useState<number | string>("")
  const [elements, setElements] = useState<string>("")
  const [elementList, setElementList] = useState<string[]>([])
  const [addTable, setAddTable] = useState<string[][]>([])
  const [mulTable, setMulTable] = useState<string[][]>([])
  const [showTables, setShowTables] = useState(false)
  const [csvData, setCsvData] = useState<any[]>([
    ['+', ...elementList],
    ...elementList.map((el, i) => [el, ...addTable[i]]),
    [],
    ['*', ...elementList],
    ...elementList.map((el, i) => [el, ...mulTable[i]])
  ])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setShowTables(false)
    handleClearTable("add")
    handleClearTable("mul")
  }, [modulus, elements])

  useEffect(() => {
    setRes(undefined)
  }, [addTable, mulTable])

  useEffect(() => {
    setCsvData([
      ['+', ...elementList],
      ...elementList.map((el, i) => [el, ...addTable[i]]),
      [],
      ['*', ...elementList],
      ...elementList.map((el, i) => [el, ...mulTable[i]])
    ]);
  }, [elementList, addTable, mulTable])

  const handleModulusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setModulus(value === "" ? "" : Number(value))
    if (value !== "") setElements("")
  }

  const handleElementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setElements(e.target.value)
    if (e.target.value.length > 0) setModulus("")
  }

  const generateTables = () => {
    const n = Number(modulus)

    if (n > 0) {
      const newElementList: string[] = Array.from({ length: n }, (_, i) => i.toString())
      setElementList(newElementList)

      const newAddTable: string[][] = Array(n).fill(null).map(() => Array(n).fill(""))
      const newMulTable: string[][] = Array(n).fill(null).map(() => Array(n).fill(""))

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newAddTable[i][j] = ((i + j) % n).toString()
          newMulTable[i][j] = ((i * j) % n).toString()
        }
      }
      setAddTable(newAddTable)
      setMulTable(newMulTable)
      setShowTables(true)
    } else {
      if (elements.length === 0) {
        setShowTables(false)
        setElementList([])
        handleClearTable("add")
        handleClearTable("mul")
      } else {
        const elemList = elements.split(",").map((e) => e.trim()).filter((e) => e.length > 0)
        const size = elemList.length
        setElementList(elemList)
        setAddTable(Array(size).fill(null).map(() => Array(size).fill("")))
        setMulTable(Array(size).fill(null).map(() => Array(size).fill("")))
        setShowTables(true)
      }
    }
  }

  const handleChange = (tableType: "add" | "mul", i: number, j: number, value: string) => {
    const table = tableType === "add" ? [...addTable] : [...mulTable]
    table[i][j] = value
    tableType === "add" ? setAddTable(table) : setMulTable(table)
  }

  const handleClearTable = (tableType: "add" | "mul") => {
    const size = elementList.length
    const emptyTable = Array(size).fill(null).map(() => Array(size).fill(""))

    if (tableType === "add") {
      setAddTable(emptyTable)
    } else {
      setMulTable(emptyTable)
    }
  }

  const handleImport = (csvFile: File | null) => {
    if (!csvFile) {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    Papa.parse(csvFile, {
      complete: (results: ParseResult<string[]>) => {
        let data = results.data as string[][]

        while (data.length > 0 && data[data.length - 1].every(cell => cell.trim() === '')) {
          data.pop()
        }

        if (data.length < 5) {
          alert("Invalid CSV format. Please ensure the CSV file contains the addition and multiplication tables in the correct format.")
          setShowTables(false)
          handleClearTable("add")
          handleClearTable("mul")
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          return
        }

        const separatorIndex = data.findIndex(row => row.every(cell => cell.trim() === ''))
        if (separatorIndex === -1 || separatorIndex === 0 || separatorIndex === data.length - 1) {
          alert("Invalid CSV format. Could not find a proper separator between addition and multiplication tables.")
          setShowTables(false)
          handleClearTable("add")
          handleClearTable("mul")
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          return
        }

        const importedElementList = data[0].slice(1).map(e => e.trim())
        const importedAddTable = data.slice(1, separatorIndex).map(row => row.slice(1).map(cell => cell.trim()))
        const importedMulTable = data.slice(separatorIndex + 2).map(row => row.slice(1).map(cell => cell.trim()))

        if (importedElementList.length === 0) {
          alert("No elements found in the CSV.")
          setShowTables(false)
          handleClearTable("add")
          handleClearTable("mul")
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          return
        }

        const expectedSize = importedElementList.length

        const isValidTable = (table: string[][], tableType: string, offset: number) => {
          const tableHeader = data[offset - 1]?.slice(1).map(cell => cell.trim())

          if (!tableHeader || tableHeader.length !== expectedSize) {
            alert(`Invalid ${tableType} table: incorrect number of column headers. Expected ${expectedSize}, got ${tableHeader?.length ?? 0}.`)
            return false
          }

          for (let i = 0; i < expectedSize; i++) {
            if (tableHeader[i] !== importedElementList[i]) {
              alert(`Invalid ${tableType} table: Column header mismatch at column ${i + 1}. Expected '${importedElementList[i]}', got '${tableHeader[i]}'.`)
              return false
            }
          }

          if (table.length !== expectedSize) {
            alert(`Invalid ${tableType} table: incorrect number of rows. Expected ${expectedSize}, got ${table.length}.`)
            setShowTables(false)
            handleClearTable("add")
            handleClearTable("mul")
            return false
          }

          for (let i = 0; i < expectedSize; i++) {
            const currentTableHeaderElement = data[offset + i]?.[0]?.trim()
            if (!currentTableHeaderElement || currentTableHeaderElement !== importedElementList[i]) {
              alert(`Invalid ${tableType} table: Row header mismatch or missing for element '${importedElementList[i]}' at row ${offset + i + 1}. Expected '${importedElementList[i]}', got '${currentTableHeaderElement || ''}'.`)
              setShowTables(false)
              handleClearTable("add")
              handleClearTable("mul")
              return false
            }
            if (table[i].length !== expectedSize) {
              alert(`Invalid ${tableType} table: Row ${i + 1} has incorrect number of columns. Expected ${expectedSize}, got ${table[i].length}.`)
              setShowTables(false)
              handleClearTable("add")
              handleClearTable("mul")
              return false
            }
            for (let j = 0; j < expectedSize; j++) {
              if (!importedElementList.includes(table[i][j])) {
                alert(`Invalid ${tableType} table: Cell value '${table[i][j]}' at row ${i + 1}, col ${j + 1} is not a valid element.`)
                setShowTables(false)
                handleClearTable("add")
                handleClearTable("mul")
                return false
              }
            }
          }
          return true
        }

        if (!isValidTable(importedAddTable, "addition", 1)) {
          if (fileInputRef.current) { fileInputRef.current.value = '' }
          return
        }

        if (!isValidTable(importedMulTable, "multiplication", separatorIndex + 2)) {
          if (fileInputRef.current) { fileInputRef.current.value = '' }
          return
        }

        setElementList(importedElementList)
        setAddTable(importedAddTable)
        setMulTable(importedMulTable)
        setShowTables(true)

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
      error: (err: Error) => {
        alert(`Error parsing CSV: ${err.message}`)
        setShowTables(false)
        handleClearTable("add")
        handleClearTable("mul")
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    })
  }

  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState<Output>()

  const handleAnalyze = async () => {
    setLoading(true)

    try {
      const isValid = (table: string[][]) =>
        table.every(row =>
          row.every(cell => elementList.includes(cell.trim()))
        )

      if (!isValid(addTable)) {
        alert("Addition table is incomplete or contains invalid elements.")
        return
      }

      if (!isValid(mulTable)) {
        alert("Multiplication table is incomplete or contains invalid elements.")
        return
      }

      const response = await analyzeRing({
        elements: elementList,
        add: addTable,
        mul: mulTable
      })
      setRes(response)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (res !== null) {
      const element = document.getElementById("analysis-result")
      if (element) element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [res])

  const PropertyDisplay: React.FC<{
    label: string
    value: boolean | undefined
    contradiction?: string
    extraInfo?: string
  }> = ({ label, value, contradiction, extraInfo }) => {
    if (value === undefined) return null

    return (
      <p className="flex items-center gap-2">
        <span className={value ? "text-green-500" : "text-red-500"}>
          {value ? "✓" : "✗"}
        </span>
        <span>{label}</span>
        {extraInfo && <span className="text-green-400 text-sm">({extraInfo})</span>}
        {!value && contradiction && (
          <span className="text-red-400 text-sm italic">
            {contradiction}
          </span>
        )}
      </p>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <main className="px-4 py-8 max-w-screen-lg mx-auto flex flex-col gap-4">
        <h1 className="text-4xl text-center font-bold">Finite Ring Analyzer</h1>

        <div className="flex flex-col gap-2">
          <label htmlFor="modulus" className="font-semibold">Generate Z<sub>n</sub> tables:</label>
          <input
            id="modulus"
            type="number"
            value={modulus}
            onChange={handleModulusChange}
            className="w-full py-1 px-2 border rounded placeholder-white/40"
            placeholder="Enter an integer for Z mod n (e.g. 4)"
            min="1"
          />
        </div>

        <div className="font-semibold">or</div>

        <div className="flex gap-4">
          <CSVLink
            data={csvData}
            filename={"ring_tables.csv"}
            className="px-4 py-2 rounded bg-[var(--secondary)] hover:bg-[var(--secondary)]/90"
          >
            Export CSV Template
          </CSVLink>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleImport(e.target.files?.[0] || null)}
            className="hidden"
            ref={fileInputRef}
            id="importCsvInput"
          />
          <label
            htmlFor="importCsvInput"
            className="px-4 py-2 rounded bg-[var(--secondary)] hover:bg-[var(--secondary)]/90 cursor-pointer"
          >
            Import CSV
          </label>
        </div>

        <div className="font-semibold">or</div>

        <div className="flex flex-col gap-2">
          <label htmlFor="elements" className="font-semibold">Enter elements:</label>
          <input
            id="elements"
            type="text"
            value={elements}
            onChange={handleElementChange}
            className="w-full py-1 px-2 border rounded placeholder-white/40"
            placeholder="Comma-separated (e.g. 0, 1, 2, 3)"
          />
          <button
            onClick={generateTables}
            className="mt-2 px-4 py-1 rounded bg-[var(--primary)] hover:bg-[var(--primary)]/90 cursor-pointer"
          >
            Generate Tables
          </button>
        </div>

        {showTables && (
          <div className="flex flex-col gap-4">
            <div className="w-full flex justify-center">
              <div className="max-w-screen-lg w-full flex flex-col md:flex-row gap-8 justify-center">
                {[
                  { label: "Addition Table", table: addTable, type: "add" },
                  { label: "Multiplication Table", table: mulTable, type: "mul" },
                ].map(({ label, table, type }) => (
                  <div key={type} className="w-full md:w-1/2">
                    <h2 className="w-full text-center text-xl font-bold mb-2">{label}</h2>
                    <div className="overflow-auto border border-white/50 rounded max-h-[70vh] relative">
                      <div className="min-w-fit">
                        <table className="border-collapse table-auto min-w-full">
                          <thead>
                            <tr>
                              <th className="sticky top-0 left-0 z-30 bg-white text-black border border-white/50 p-2 text-center">
                                {type == "add" ? "+" : "*"}
                              </th>
                              {elementList.map((el, idx) => (
                                <th
                                  key={idx}
                                  className="sticky top-0 z-10 bg-white text-black border border-white/50 p-2 text-nowrap"
                                >
                                  {el}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {elementList.map((rowElement, i) => (
                              <tr key={i}>
                                <th className="sticky left-0 z-10 bg-white text-black border border-white/50 px-4 py-2 text-nowrap">
                                  {rowElement}
                                </th>
                                {elementList.map((_, j) => (
                                  <td key={j} className="border border-white/50 p-2">
                                    <div className="flex items-center justify-center">
                                      <input
                                        type="text"
                                        className="min-w-16 w-full p-1 border border-white/50 rounded"
                                        value={table[i][j] || ""}
                                        onChange={(e) =>
                                          handleChange(type as "add" | "mul", i, j, e.target.value)
                                        }
                                      />
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearTable(type as "add" | "mul")}
                      className="w-full mt-4 px-4 py-1 rounded bg-[var(--primary)] hover:bg-[var(--primary)]/90 cursor-pointer"
                    >
                      Clear {label}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button className="flex gap-2 justify-center items-center mt-2 px-4 py-1 rounded bg-[var(--secondary)] hover:bg-[var(--secondary)]/90 disabled:bg-[var(--secondary)]/90 cursor-pointer disabled:cursor-default" onClick={handleAnalyze} disabled={loading}>
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <div>{loading ? "Analyzing..." : "Analyze Ring"}</div>
            </button>
          </div>
        )}

        {res && (
          <div id="analysis-result" className="bg-white/10 p-6 rounded-lg shadow-lg mt-2">
            <h2 className="text-3xl font-bold mb-6 text-center border-b-2 border-white/30 pb-4">Analysis Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 ">
              <div className="pb-8 border-b-2 border-white/30 md:border-b-0 md:border-r-2 md:pr-8">
                <h3 className="text-2xl font-semibold mb-4 text-center">Addition Properties</h3>
                <div className="flex flex-col gap-2">
                  <PropertyDisplay
                    label="Closure"
                    value={res.is_add_closed}
                    contradiction={res.is_add_closed_contradiction}
                  />
                  <PropertyDisplay
                    label="Associativity"
                    value={res.is_add_associative}
                    contradiction={res.is_add_associative_contradiction}
                  />
                  <PropertyDisplay
                    label="Identity Element"
                    value={res.has_add_identity}
                    extraInfo={res.has_add_identity ? `Element: ${res.add_identity}` : ""}
                  />
                  <PropertyDisplay
                    label="Inverse Element for all elements"
                    value={res.is_add_inverse}
                    contradiction={res.is_add_inverse_contradiction}
                  />
                  <PropertyDisplay
                    label="Commutativity"
                    value={res.is_add_commutative}
                    contradiction={res.is_add_commutative_contradiction}
                  />
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <PropertyDisplay
                      label="Forms an Additive Group"
                      value={res.is_add_group}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 text-center">Multiplication Properties</h3>
                <div className="flex flex-col gap-2">
                  <PropertyDisplay
                    label="Closure"
                    value={res.is_mul_closed}
                    contradiction={res.is_mul_closed_contradiction}
                  />
                  <PropertyDisplay
                    label="Associativity"
                    value={res.is_mul_associative}
                    contradiction={res.is_mul_associative_contradiction}
                  />
                  <PropertyDisplay
                    label="Distributivity of multiplication over addition"
                    value={res.is_distributive}
                    contradiction={res.is_distributive_contradiction}
                  />
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <PropertyDisplay
                      label="Is a Ring"
                      value={res.is_ring}
                      contradiction={res.is_ring_contradiction}
                    />
                  </div>
                  <PropertyDisplay
                    label="Commutativity"
                    value={res.is_mul_commutative}
                    contradiction={res.is_mul_commutative_contradiction}
                  />
                  <PropertyDisplay
                    label="Is a Commutative Ring"
                    value={res.is_commutative_ring}
                    contradiction={res.is_commutative_ring_contradiction}
                  />

                  <div className="mt-4 pt-4 border-t border-white/30">
                    <PropertyDisplay
                      label="Multiplicative Identity"
                      value={res.has_mul_identity}
                      extraInfo={res.has_mul_identity ? `Element: ${res.mul_identity}` : ""}
                    />
                  </div>
                  <PropertyDisplay
                    label="Has Zero Divisors"
                    value={res.has_mul_zero_divisors}
                    contradiction={res.has_mul_zero_divisors ? res.has_mul_zero_divisors_contradiction : ""}
                  />
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <PropertyDisplay
                      label="Is an Integral Domain"
                      value={res.is_integral_domain}
                      contradiction={res.is_integral_domain_contradiction}
                    />
                  </div>
                  <PropertyDisplay
                    label="Multiplicative Inverse for non-zero elements"
                    value={res.is_mul_inverse}
                    contradiction={res.is_mul_inverse_contradiction}
                  />
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <PropertyDisplay
                      label="Is a Division Ring"
                      value={res.is_divison_ring}
                      contradiction={res.is_divison_ring_contradiction}
                    />
                    <PropertyDisplay
                      label="Is a Field"
                      value={res.is_field}
                      contradiction={res.is_field_contradiction}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-white/30">
              <h3 className="text-2xl font-semibold mb-3 text-center">Insight</h3>
              <p className="text-lg text-white/90 text-center">{res.insight}</p>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-white/30">
              <h3 className="text-2xl font-semibold mb-3 text-center">Visualizations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {res.add_heatmap && (
                  <div className="flex flex-col items-center col-span-1">
                    <h4 className="text-xl font-medium mb-2">Addition Heatmap</h4>
                    <img src={`data:image/png;base64,${res.add_heatmap}`} alt="Addition Heatmap" className="w-full h-auto object-contain rounded shadow flex-grow" />
                  </div>
                )}
                {res.mul_heatmap && (
                  <div className="flex flex-col items-center col-span-1">
                    <h4 className="text-xl font-medium mb-2">Multiplication Heatmap</h4>
                    <img src={`data:image/png;base64,${res.mul_heatmap}`} alt="Multiplication Heatmap" className="w-full h-auto object-contain rounded shadow flex-grow" />
                  </div>
                )}
                {res.zero_divisor_graph && (
                  <div className="flex flex-col items-center col-span-1">
                    <h4 className="text-xl font-medium mb-2">Zero Divisor Graph</h4>
                    <img src={`data:image/png;base64,${res.zero_divisor_graph}`} alt="Zero Divisor Graph" className="w-full h-auto object-contain rounded shadow flex-grow" />
                  </div>
                )}
                {res.unit_graph && (
                  <div className="flex flex-col items-center col-span-1">
                    <h4 className="text-xl font-medium mb-2">Unit Graph</h4>
                    <img src={`data:image/png;base64,${res.unit_graph}`} alt="Unit Graph" className="w-full h-auto object-contain rounded shadow flex-grow" />
                  </div>
                )}
                {res.colormap && (
                  <div className="flex flex-col items-center col-span-1 md:col-span-2">
                    <h4 className="text-xl font-medium mb-2">Colormap</h4>
                    <img src={`data:image/png;base64,${res.colormap}`} alt="Colormap" className="max-w-full h-auto object-contain rounded shadow flex-grow" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App