'use client'

import React, { useMemo } from 'react'

interface WordCloudProps {
  words: string[]
  weights?: number[]
  className?: string
  maxWords?: number
}

export function WordCloud({ 
  words, 
  weights, 
  className = '', 
  maxWords = 30 
}: WordCloudProps) {
  const wordData = useMemo(() => {
    // Create word frequency map if weights not provided
    const wordMap = new Map<string, number>()
    
    if (weights && weights.length === words.length) {
      words.forEach((word, index) => {
        wordMap.set(word, weights[index])
      })
    } else {
      // Count frequencies
      words.forEach(word => {
        wordMap.set(word, (wordMap.get(word) || 0) + 1)
      })
    }
    
    // Sort by frequency and limit
    const sortedWords = Array.from(wordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxWords)
    
    // Calculate sizes
    const maxFreq = Math.max(...sortedWords.map(([, freq]) => freq))
    const minFreq = Math.min(...sortedWords.map(([, freq]) => freq))
    const range = maxFreq - minFreq || 1
    
    return sortedWords.map(([word, freq]) => {
      // Normalize frequency to size range (0.7rem to 2rem)
      const normalizedSize = (freq - minFreq) / range
      const size = 0.7 + normalizedSize * 1.3 // rem
      
      // Determine opacity based on frequency (0.6 to 1)
      const opacity = 0.6 + normalizedSize * 0.4
      
      // Determine color shade based on frequency
      const grayShade = Math.round(900 - normalizedSize * 300) // 600-900
      
      return {
        word,
        size,
        opacity,
        className: `text-gray-${grayShade}`,
        rawFreq: freq
      }
    })
  }, [words, weights, maxWords])
  
  // Shuffle words for more organic layout
  const shuffledWords = useMemo(() => {
    const shuffled = [...wordData]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [wordData])
  
  return (
    <div className={`flex flex-wrap gap-2 md:gap-3 justify-center items-center p-4 ${className}`}>
      {shuffledWords.map((item, index) => (
        <span
          key={`${item.word}-${index}`}
          className={`inline-block transition-all duration-300 hover:scale-110 cursor-default select-none`}
          style={{
            fontSize: `${item.size}rem`,
            opacity: item.opacity,
            color: item.rawFreq > (wordData[0]?.rawFreq || 0) * 0.7 ? '#111827' : 
                   item.rawFreq > (wordData[0]?.rawFreq || 0) * 0.4 ? '#374151' : '#6b7280',
            fontWeight: item.size > 1.5 ? 600 : item.size > 1 ? 500 : 400,
            lineHeight: 1.2
          }}
          title={`Frequency: ${item.rawFreq}`}
        >
          {item.word}
        </span>
      ))}
    </div>
  )
}