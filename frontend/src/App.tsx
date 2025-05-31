import { useState } from "react"

function App() {
  const [elements, setElements] = useState<string>("")
  const [elementList, setElementList] = useState<string[]>([])
  const [addTable, setAddTable] = useState<string[][]>([])
  const [mulTable, setMulTable] = useState<string[][]>([])
  const [showTables, setShowTables] = useState(false)

  const handleElementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setElements(e.target.value)
  }

  const generateTables = () => {
    if (elements.length == 0) setShowTables(false)
    else {
      const elemList = elements.split(",").map((e) => e.trim()).filter((e) => e.length > 0)
      const size = elemList.length
      setElementList(elemList)
      setAddTable(Array(size).fill(null).map(() => Array(size).fill("")))
      setMulTable(Array(size).fill(null).map(() => Array(size).fill("")))
      setShowTables(true)
    }
  }

  const handleChange = (tableType: "add" | "mul", i: number, j: number, value: string) => {
    const table = tableType === "add" ? [...addTable] : [...mulTable]
    table[i][j] = value
    tableType === "add" ? setAddTable(table) : setMulTable(table)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <main className="px-4 py-8 max-w-screen-lg mx-auto flex flex-col gap-4">
        <h1 className="text-4xl text-center font-bold">Finite Ring Analyzer</h1>

        {/* TODO: Enter/Generate Z mod value */}

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

        {/* TODO: Export / Import CSV */}

        {showTables && (
          <div className="flex flex-col gap-4">
            <div className="w-full flex justify-center">
              <div className="max-w-screen-lg w-full flex flex-col md:flex-row gap-8 justify-center">
                {[
                  { label: "Addition Table", table: addTable, type: "add" },
                  { label: "Multiplication Table", table: mulTable, type: "mul" },
                ].map(({ label, table, type }) => (
                  <div key={type} className="w-full md:w-1/2">
                    <h2 className="w-full text-center text-xl font-semibold mb-2">{label}</h2>
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
                  </div>
                ))}
              </div>
            </div>

            <button className="mt-2 px-4 py-1 rounded bg-[var(--secondary)] hover:bg-[var(--secondary)]/90 cursor-pointer">
              Analyze Ring
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
