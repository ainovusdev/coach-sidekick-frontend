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
  maxWords = 25 
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
    
    return sortedWords.map(([word, freq], index) => {
      // Normalize frequency to size range
      const normalizedSize = (freq - minFreq) / range
      const size = 0.75 + normalizedSize * 1.75 // rem (0.75rem to 2.5rem)
      
      // Categorize words into tiers for better visual hierarchy
      const tier = index < 3 ? 'primary' : 
                   index < 8 ? 'secondary' : 
                   index < 15 ? 'tertiary' : 'quaternary'
      
      return {
        word,
        size,
        tier,
        rawFreq: freq,
        index
      }
    })
  }, [words, weights, maxWords])
  
  // Create a more interesting layout pattern
  const arrangedWords = useMemo(() => {
    const arranged = [...wordData]
    // Mix important and less important words for visual balance
    const result = []
    const primary = arranged.filter(w => w.tier === 'primary')
    const secondary = arranged.filter(w => w.tier === 'secondary')
    const others = arranged.filter(w => w.tier !== 'primary' && w.tier !== 'secondary')
    
    // Interleave for better distribution
    let pi = 0, si = 0, oi = 0
    for (let i = 0; i < arranged.length; i++) {
      if (i % 4 === 0 && pi < primary.length) {
        result.push(primary[pi++])
      } else if (i % 4 === 2 && si < secondary.length) {
        result.push(secondary[si++])
      } else if (oi < others.length) {
        result.push(others[oi++])
      } else if (pi < primary.length) {
        result.push(primary[pi++])
      } else if (si < secondary.length) {
        result.push(secondary[si++])
      }
    }
    
    return result
  }, [wordData])
  
  const getWordStyle = (item: typeof wordData[0]) => {
    // Enhanced styling based on tier
    const baseStyles = {
      fontSize: `${item.size}rem`,
      lineHeight: 1.1,
      transition: 'all 0.3s ease',
    }
    
    switch(item.tier) {
      case 'primary':
        return {
          ...baseStyles,
          color: '#111827', // gray-900
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }
      case 'secondary':
        return {
          ...baseStyles,
          color: '#374151', // gray-700
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }
      case 'tertiary':
        return {
          ...baseStyles,
          color: '#6b7280', // gray-500
          fontWeight: 500,
        }
      default:
        return {
          ...baseStyles,
          color: '#9ca3af', // gray-400
          fontWeight: 400,
        }
    }
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-gray-50/50 rounded-lg" />
      
      {/* Word cloud container */}
      <div className="relative flex flex-wrap gap-3 md:gap-4 justify-center items-center p-6">
        {arrangedWords.map((item, index) => {
          const isImportant = item.tier === 'primary' || item.tier === 'secondary'
          
          return (
            <div
              key={`${item.word}-${index}`}
              className={`
                inline-flex items-center justify-center
                transition-all duration-300 ease-out
                hover:scale-110 hover:z-10
                cursor-default select-none
                ${isImportant ? 'hover:drop-shadow-lg' : 'hover:drop-shadow-md'}
                ${item.tier === 'primary' ? 'px-3 py-1 bg-gradient-to-r from-gray-100/80 to-gray-50/80 rounded-lg' : ''}
                ${item.tier === 'secondary' ? 'px-2 py-0.5 bg-gray-50/60 rounded-md' : ''}
              `}
              style={{
                ...getWordStyle(item),
                transform: `rotate(${index % 5 === 0 ? Math.random() * 6 - 3 : 0}deg)`,
              }}
              onMouseEnter={(e) => {
                if (isImportant) {
                  e.currentTarget.style.transform = `scale(1.1) rotate(0deg)`
                }
              }}
              onMouseLeave={(e) => {
                if (isImportant) {
                  e.currentTarget.style.transform = `scale(1) rotate(${index % 5 === 0 ? Math.random() * 6 - 3 : 0}deg)`
                }
              }}
              title={`Frequency: ${item.rawFreq}`}
            >
              <span className="relative">
                {item.word}
                {item.tier === 'primary' && (
                  <span className="absolute -top-1 -right-2 text-xs text-gray-400 font-normal">
                    {item.rawFreq > 1 && `×${item.rawFreq}`}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent rounded-lg" />
      </div>
    </div>
  )
}