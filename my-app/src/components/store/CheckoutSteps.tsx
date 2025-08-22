'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface CheckoutStepsProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepId: number) => void
  allowClickPrevious?: boolean
  className?: string
}

export function CheckoutSteps({ 
  steps, 
  currentStep, 
  onStepClick, 
  allowClickPrevious = false,
  className 
}: CheckoutStepsProps) {
  const handleStepClick = (stepId: number) => {
    if (!onStepClick) return
    
    // Permite clicar apenas em steps anteriores se allowClickPrevious for true
    if (allowClickPrevious && stepId < currentStep) {
      onStepClick(stepId)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Version */}
      <div className="hidden md:flex items-center justify-center">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          const isClickable = allowClickPrevious && step.id < currentStep
          
          return (
            <div key={step.id} className="flex items-center">
              <div 
                className={cn(
                  'flex items-center',
                  isClickable && 'cursor-pointer'
                )}
                onClick={() => handleStepClick(step.id)}
              >
                {/* Step Circle */}
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isActive
                    ? 'border-primary text-primary bg-background'
                    : 'border-muted-foreground text-muted-foreground bg-background',
                  isClickable && 'hover:border-primary hover:text-primary'
                )}>
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : Icon ? (
                    <Icon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                
                {/* Step Info */}
                <div className="ml-3 mr-6">
                  <p className={cn(
                    'text-sm font-medium transition-colors',
                    isActive 
                      ? 'text-primary' 
                      : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                    isClickable && 'hover:text-primary'
                  )}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-12 h-0.5 transition-colors',
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          )
        })}
      </div>
      
      {/* Mobile Version */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-muted-foreground">
            Passo {currentStep} de {steps.length}
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round((currentStep / steps.length) * 100)}% concluído
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        
        {/* Current Step Info */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {steps.map((step) => {
              if (step.id !== currentStep) return null
              
              const Icon = step.icon
              return (
                <div key={step.id} className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground">
                  {Icon ? (
                    <Icon className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-medium">{step.id}</span>
                  )}
                </div>
              )
            })}
          </div>
          
          <h3 className="text-lg font-semibold">
            {steps.find(step => step.id === currentStep)?.title}
          </h3>
          
          {steps.find(step => step.id === currentStep)?.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {steps.find(step => step.id === currentStep)?.description}
            </p>
          )}
        </div>
        
        {/* Step Dots */}
        <div className="flex justify-center mt-4 space-x-2">
          {steps.map((step) => (
            <button
              key={step.id}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                step.id === currentStep
                  ? 'bg-primary'
                  : step.id < currentStep
                  ? 'bg-primary/60'
                  : 'bg-muted',
                allowClickPrevious && step.id < currentStep && 'cursor-pointer hover:bg-primary'
              )}
              onClick={() => handleStepClick(step.id)}
              disabled={!allowClickPrevious || step.id >= currentStep}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CheckoutSteps