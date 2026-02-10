import React, { useState, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ChevronDown, Check } from 'lucide-react'

const Dropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  style: styleProp,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [hovered, setHovered] = useState(false)
  const containerRef = useRef(null)
  const optionsRef = useRef(null)

  const selectedOption = options.find(o => String(o.value) === String(value))

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex(o => String(o.value) === String(value))
      setHighlightedIndex(idx >= 0 ? idx : 0)
    }
  }, [isOpen])

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && optionsRef.current && highlightedIndex >= 0) {
      const items = optionsRef.current.children
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleKeyDown = useCallback((e) => {
    if (disabled) return

    if (e.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          onChange && onChange(options[highlightedIndex].value)
          setIsOpen(false)
        }
        break
    }
  }, [disabled, isOpen, highlightedIndex, options, onChange])

  const handleSelect = (val) => {
    onChange && onChange(val)
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', ...styleProp }}
      className={className}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Trigger */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#111111',
          border: `1px solid ${isOpen || hovered ? '#3a3a3a' : '#2a2a2a'}`,
          borderRadius: '8px',
          padding: '10px 14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 150ms ease',
          boxShadow: isOpen || hovered ? '0 0 8px rgba(255,255,255,0.06)' : 'none',
          fontSize: '14px',
          fontFamily: 'inherit',
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={{
          color: selectedOption ? '#ffffff' : '#999',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          color="#ffffff"
          style={{
            flexShrink: 0,
            marginLeft: '8px',
            transition: 'transform 150ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'linear-gradient(180deg, #1a1a1a 0%, #111111 100%)',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(255,255,255,0.04)',
            zIndex: 50,
            overflow: 'hidden',
            animation: 'ddFadeIn 150ms ease',
          }}
        >
          {/* Shimmer overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)',
              backgroundSize: '200% 200%',
              animation: 'ddShimmer 3s ease infinite',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <div
            ref={optionsRef}
            style={{
              position: 'relative',
              zIndex: 2,
              maxHeight: '240px',
              overflowY: 'auto',
              padding: '4px 0',
            }}
          >
            {options.map((option, index) => {
              const isSelected = String(option.value) === String(value)
              const isHighlighted = index === highlightedIndex
              return (
                <div
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    transition: 'all 100ms ease',
                    backgroundColor: isHighlighted
                      ? 'rgba(255,255,255,0.06)'
                      : isSelected
                        ? 'rgba(255,255,255,0.08)'
                        : 'transparent',
                    color: isSelected || isHighlighted ? '#ffffff' : '#999',
                    fontSize: '14px',
                  }}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span style={{ width: '20px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {isSelected && <Check size={12} color="#ffffff" />}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {option.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

Dropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
}

export default Dropdown
