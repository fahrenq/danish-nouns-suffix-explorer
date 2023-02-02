import { type VNode } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import commonEndingsTsv from './assets/common-endings.tsv?url'

const MAX_USAGE_SCORE = 0.01269

interface CommonEnding {
  numberOfLetters: number
  lastLetters: string
  wordCount: number
  usageScore: number
  enCount: number
  etCount: number
  enWords: string[]
  etWords: string[]
}

interface Filters {
  numberOfLetters: number | 'any'
  koen: 'en' | 'et' | 'both'
  sortBy: 'usageScore' | 'wordCount'
}

const Examples = ({ commonEnding }: { commonEnding: CommonEnding }): VNode => {
  return (
    <div class="flex">
      <div class="h-64 overflow-auto flex-1 bg-green-100">
        <div class="sticky top-0 bg-green-200 text-center">fælleskøn (en)</div>
        <div class="p-2">
          {commonEnding.enWords.map(word => <div key={word}>{word}</div>)}
        </div>
      </div>
      <div class="h-64 overflow-auto flex-1 bg-blue-100">
        <div class="sticky top-0 bg-blue-200 text-center">intetkøn (et)</div>
        <div class="p-2">
          {commonEnding.etWords.map(word => <div key={word}>{word}</div>)}
        </div>
      </div>
    </div>
  )
}

const Koen = ({ commonEnding }: { commonEnding: CommonEnding }): VNode => {
  const enPercentage = commonEnding.enCount / commonEnding.wordCount * 100
  const etPercentage = commonEnding.etCount / commonEnding.wordCount * 100

  return (
    <>
    <div class="flex gap-1 text-sm leading-none">
      <div class="text-green-800">en</div>
      <div class={`flex-1 w-full border-2 border-dashed box-content h-3 ${enPercentage > etPercentage ? 'border-green-300' : 'border-blue-300'}`}>
        <div class="inline-block h-full bg-green-400" style={{ width: `${enPercentage}%` }} />
        <div class="inline-block h-full bg-blue-400" style={{ width: `${etPercentage}%` }} />
      </div>
      <div class="text-blue-800">en</div>
    </div>
    <div class="flex text-sm">
      <div class="flex-1 text-green-800">
        {commonEnding.enCount} <span class="text-slate-400">({ (commonEnding.enCount / commonEnding.wordCount * 100).toFixed(2) }%)</span>
      </div>
      <div class="flex-1 text-blue-800 text-right">
        <span class="text-slate-400">({ (commonEnding.etCount / commonEnding.wordCount * 100).toFixed(2) }%)</span> {commonEnding.etCount}
      </div>
    </div>
    {/* <Examples commonEnding={commonEnding} /> */}
    </>
  )
}

const Row = ({ commonEnding, onExpand, isExpanded }: { commonEnding: CommonEnding, onExpand: () => void, isExpanded: boolean }): VNode => {
  return (
    <>
    <div class="flex items-center p-2 pr-4 even:bg-slate-100">
      <div class="basis-1/6 font-mono text-center">-{commonEnding.lastLetters}</div>
      <div class="basis-1/6 text-center">{commonEnding.usageScore}</div>
      <div class="basis-1/6 text-center">
        {commonEnding.wordCount}
        <div class="text-xs cursor-pointer underline" onClick={() => { onExpand() }}>{ isExpanded ? 'Hide' : 'Show' }</div></div>
      <div class="basis-3/6"><Koen commonEnding={commonEnding} /></div>
    </div>
    {isExpanded && <Examples commonEnding={commonEnding} />}
    </>
  )
}

export function App (): VNode {
  const [allCommonEndings, setAllCommonEndings] = useState<CommonEnding[]>([])
  const [commonEndings, setCommonEndings] = useState<CommonEnding[]>([])
  const [expandedEndings, setExpandedEndings] = useState<string[]>([])

  const [filters, setFilters] = useState<Filters>({
    numberOfLetters: 'any',
    koen: 'both',
    sortBy: 'usageScore'
  })

  const reloadCommonEndings = async (): Promise<void> => {
    console.log('reload words')
    const response = await fetch(commonEndingsTsv)
    const text = await response.text()
    const lines = text.split('\n').slice(1).filter(line => line.length > 0)
    setAllCommonEndings(lines.map(line => {
      // eslint-disable-next-line no-tabs
      // number_of_letters	last_letters	word_count	usage_score	en_count	et_count	en_words	et_words
      const [numberOfLettersString, lastLetters, wordCountString, usageScoreString, enCountString, etCountString, enWordsRaw, etWordsRaw] = line.split('\t')
      const enWords = enWordsRaw?.split(',').filter(word => word.length > 0) ?? []
      const etWords = etWordsRaw?.split(',').filter(word => word.length > 0) ?? []

      const numberOfLetters = parseInt(numberOfLettersString, 10)
      const enCount = parseInt(enCountString, 10)
      const etCount = parseInt(etCountString, 10)
      const wordCount = parseInt(wordCountString, 10)
      const usageScoreRaw = parseFloat(usageScoreString)
      const usageScore = Math.round(usageScoreRaw / MAX_USAGE_SCORE * 100)

      return { numberOfLetters, lastLetters, wordCount, usageScore, enCount, etCount, enWords, etWords }
    }))
  }

  useEffect(() => {
    void reloadCommonEndings()
  }, [])

  useEffect(() => {
    const filteredCommonEndings = allCommonEndings.filter(commonEnding => {
      if (filters.numberOfLetters !== 'any' && commonEnding.numberOfLetters !== filters.numberOfLetters) {
        return false
      }
      if (filters.koen === 'en' && commonEnding.etCount > 0) {
        return false
      }
      if (filters.koen === 'et' && commonEnding.enCount > 0) {
        return false
      }
      return true
    }).sort((a, b) => {
      if (filters.sortBy === 'usageScore') {
        return b.usageScore - a.usageScore
      }
      if (filters.sortBy === 'wordCount') {
        return b.wordCount - a.wordCount
      }
      return 0
    })

    setCommonEndings(filteredCommonEndings)
  }, [filters, allCommonEndings])

  return (
    <>
      <div class="w-full border border-black bg-white">
        <div class="flex gap-2 bg-amber-200 p-2">
          <div class="flex-1">
            <div>Last letters count</div>
            <div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="radio" value="any" checked={filters.numberOfLetters === 'any'} onChange={event => { setFilters({ ...filters, numberOfLetters: 'any' }) }} />
                3 & 4
              </label>
            </div>

            <div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="radio" value="3" checked={filters.numberOfLetters === 3} onChange={event => { setFilters({ ...filters, numberOfLetters: 3 }) }} />
                Only 3
              </label>
            </div>

            <div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="radio" value="4" checked={filters.numberOfLetters === 4} onChange={event => { setFilters({ ...filters, numberOfLetters: 4 }) }} />
                Only 4
              </label>
            </div>
          </div>

          <div class="flex-1">
            <div>Sort by</div>
            <div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="radio" value="usageScore" checked={filters.sortBy === 'usageScore'} onChange={event => { setFilters({ ...filters, sortBy: 'usageScore' }) }} />
                Usage frequency
              </label>
            </div>

            <div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="radio" value="wordCount" checked={filters.sortBy === 'wordCount'} onChange={event => { setFilters({ ...filters, sortBy: 'wordCount' }) }} />
                Total word count
              </label>
            </div>
          </div>

          <div class="flex-1">
            <div>Køn</div>
            <div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="radio" value="both" checked={filters.koen === 'both'} onChange={event => { setFilters({ ...filters, koen: 'both' }) }} />
                Both
              </label>
            </div>

            <div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="radio" value="en" checked={filters.koen === 'en'} onChange={event => { setFilters({ ...filters, koen: 'en' }) }} />
                fælleskøn (en) only
              </label>
            </div>

            <div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="radio" value="et" checked={filters.koen === 'et'} onChange={event => { setFilters({ ...filters, koen: 'et' }) }} />
                intetkøn (et) only
              </label>
            </div>
          </div>
        </div>

        <div class="flex p-2 pr-4 text-center bg-slate-200">
          <div class="basis-1/6">Last letters</div>
          <div class="basis-1/6">Usage score</div>
          <div class="basis-1/6">Word count</div>
          <div class="basis-3/6">Køn</div>
        </div>
        <div class="overflow-auto max-h-[500px]">
          {commonEndings.map(commonEnding => <Row commonEnding={commonEnding} key={commonEnding.lastLetters} isExpanded={expandedEndings.includes(commonEnding.lastLetters)} onExpand={
            () => {
              if (expandedEndings.includes(commonEnding.lastLetters)) {
                setExpandedEndings(expandedEndings.filter(ending => ending !== commonEnding.lastLetters))
              } else {
                setExpandedEndings([...expandedEndings, commonEnding.lastLetters])
              }
            }
          } />)}
        </div>
      </div>
    </>
  )
}
