'use client'

import { ReactNode, forwardRef, type AnchorHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Touch target mínimo recomendado: 44px x 44px (iOS) / 48dp (Android)
// Usamos valores explícitos nas classes Tailwind (min-w/min-h) para garantir acessibilidade nas interações touch.

interface TouchButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  hapticFeedback?: boolean
  'aria-label'?: string
  type?: 'button' | 'submit' | 'reset'
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>((
  {
    children,
    onClick,
    disabled = false,
    variant = 'primary',
    size = 'md',
    className,
    hapticFeedback = true,
    'aria-label': ariaLabel,
    type = 'button',
    ...props
  },
  ref
) => {
  const handleClick = () => {
    if (disabled) return
    
    // Haptic feedback para dispositivos que suportam
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    onClick?.()
  }

  const baseClasses = cn(
    "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-95 select-none", // Touch feedback
    // Minimum touch target size
    size === 'sm' && "min-w-[44px] min-h-[44px] text-sm px-3 py-2",
    size === 'md' && "min-w-[48px] min-h-[48px] text-base px-4 py-3",
    size === 'lg' && "min-w-[52px] min-h-[52px] text-lg px-6 py-4",
    className
  )

  const variantClasses = {
    primary: "bg-black text-white hover:bg-gray-800 focus:ring-gray-500 rounded-lg",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 rounded-lg",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500 rounded-lg",
    icon: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 rounded-full"
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      className={cn(baseClasses, variantClasses[variant])}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  )
})

TouchButton.displayName = 'TouchButton'

// Componente para links com touch targets otimizados
interface TouchLinkProps {
  children: ReactNode
  href: string
  external?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  'aria-label'?: string
}

export function TouchLink({
  children,
  href,
  external = false,
  className,
  size = 'md',
  'aria-label': ariaLabel
}: TouchLinkProps) {
  const baseClasses = cn(
    "relative inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    "active:scale-95 select-none", // Touch feedback
    // Minimum touch target size
    size === 'sm' && "min-w-[44px] min-h-[44px] text-sm px-3 py-2",
    size === 'md' && "min-w-[48px] min-h-[48px] text-base px-4 py-3",
    size === 'lg' && "min-w-[52px] min-h-[52px] text-lg px-6 py-4",
    "rounded-lg hover:bg-gray-100",
    className
  )

  const linkProps: AnchorHTMLAttributes<HTMLAnchorElement> = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <motion.a
      href={href}
      className={baseClasses}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.95 }}
      {...linkProps}
    >
      {children}
    </motion.a>
  )
}

// Componente para inputs com touch targets otimizados
interface TouchInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'search'
  placeholder?: string
  value?: string
  onChange?: ((value: string) => void) | ((event: React.ChangeEvent<HTMLInputElement>) => void)
  disabled?: boolean
  error?: boolean
  className?: string
  'aria-label'?: string
  name?: string
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
}

export const TouchInput = forwardRef<HTMLInputElement, TouchInputProps>((
  {
    type = 'text',
    placeholder,
    value,
    onChange,
    disabled = false,
    error = false,
    className,
    'aria-label': ariaLabel,
    name,
    onBlur,
    ...props
  },
  ref
) => {
  const baseClasses = cn(
    "w-full px-4 py-3 text-base border rounded-lg transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-1",
    "min-h-[48px]", // Minimum touch target height
    "disabled:opacity-50 disabled:cursor-not-allowed",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
    className
  )

  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        if (onChange) {
          // Verifica se onChange espera um evento ou uma string
          if (onChange.length === 1) {
            // Se espera apenas um parâmetro, pode ser tanto string quanto evento
            try {
              (onChange as (value: string) => void)(e.target.value)
            } catch {
              (onChange as (event: React.ChangeEvent<HTMLInputElement>) => void)(e)
            }
          } else {
            (onChange as (event: React.ChangeEvent<HTMLInputElement>) => void)(e)
          }
        }
      }}
      onBlur={onBlur}
      disabled={disabled}
      className={baseClasses}
      aria-label={ariaLabel}
      name={name}
      {...props}
    />
  )
})

TouchInput.displayName = 'TouchInput'

// Componente para selects com touch targets otimizados
interface TouchSelectProps {
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
  'aria-label'?: string
}

export function TouchSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  disabled = false,
  error = false,
  className,
  'aria-label': ariaLabel
}: TouchSelectProps) {
  const baseClasses = cn(
    "w-full px-4 py-3 text-base border rounded-lg transition-all duration-200 bg-white",
    "focus:outline-none focus:ring-2 focus:ring-offset-1",
    "min-h-[48px]", // Minimum touch target height
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "appearance-none cursor-pointer",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
    className
  )

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={baseClasses}
        aria-label={ariaLabel}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Custom arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

// Componente para checkboxes com touch targets otimizados
interface TouchCheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function TouchCheckbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  className,
  'aria-label': ariaLabel
}: TouchCheckboxProps) {
  const handleChange = () => {
    if (disabled) return
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    onChange?.(!checked)
  }

  return (
    <label className={cn("flex items-center cursor-pointer", disabled && "cursor-not-allowed opacity-50", className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          aria-label={ariaLabel}
        />
        <motion.div
          className={cn(
            "w-6 h-6 border-2 rounded transition-all duration-200 flex items-center justify-center",
            "min-w-[44px] min-h-[44px] -m-2 p-2", // Expanded touch target
            checked
              ? "bg-blue-600 border-blue-600"
              : "bg-white border-gray-300 hover:border-gray-400"
          )}
          whileTap={{ scale: 0.95 }}
          onClick={handleChange}
        >
          {checked && (
            <motion.svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </motion.div>
      </div>
      {label && (
        <span className="ml-3 text-sm text-gray-700 select-none">
          {label}
        </span>
      )}
    </label>
  )
}

// Componente para radio buttons com touch targets otimizados
interface TouchRadioProps {
  name: string
  value: string
  checked?: boolean
  onChange?: (value: string) => void
  label?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function TouchRadio({
  name,
  value,
  checked = false,
  onChange,
  label,
  disabled = false,
  className,
  'aria-label': ariaLabel
}: TouchRadioProps) {
  const handleChange = () => {
    if (disabled) return
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    onChange?.(value)
  }

  return (
    <label className={cn("flex items-center cursor-pointer", disabled && "cursor-not-allowed opacity-50", className)}>
      <div className="relative">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          aria-label={ariaLabel}
        />
        <motion.div
          className={cn(
            "w-6 h-6 border-2 rounded-full transition-all duration-200 flex items-center justify-center",
            "min-w-[44px] min-h-[44px] -m-2 p-2", // Expanded touch target
            checked
              ? "bg-blue-600 border-blue-600"
              : "bg-white border-gray-300 hover:border-gray-400"
          )}
          whileTap={{ scale: 0.95 }}
          onClick={handleChange}
        >
          {checked && (
            <motion.div
              className="w-3 h-3 bg-white rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.div>
      </div>
      {label && (
        <span className="ml-3 text-sm text-gray-700 select-none">
          {label}
        </span>
      )}
    </label>
  )
}

// Hook para detectar se é um dispositivo touch
export function useIsTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Componente wrapper que aplica otimizações de touch automaticamente
interface TouchOptimizedProps {
  children: ReactNode
  className?: string
}

export function TouchOptimized({ children, className }: TouchOptimizedProps) {
  const isTouchDevice = useIsTouchDevice()
  
  if (!isTouchDevice) {
    return <div className={className}>{children}</div>
  }

  return (
    <div 
      className={cn(
        "touch-manipulation", // Otimiza gestos de touch
        "[&_button]:min-h-[44px] [&_a]:min-h-[44px] [&_input]:min-h-[48px]", // Aplica tamanhos mínimos
        className
      )}
      style={{
        WebkitTapHighlightColor: 'transparent', // Remove highlight padrão do iOS
        touchAction: 'manipulation' // Melhora responsividade
      }}
    >
      {children}
    </div>
  )
}