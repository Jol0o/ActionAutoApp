# Color Refactoring Script
# Replaces hardcoded Tailwind colors with semantic design tokens

$files = Get-ChildItem -Path "src/app" -Filter "page.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Background colors - slate
    $content = $content -replace 'bg-slate-50/50', 'bg-background'
    $content = $content -replace 'bg-slate-50', 'bg-secondary'
    $content = $content -replace 'bg-slate-100', 'bg-secondary'
    $content = $content -replace 'bg-slate-200', 'bg-muted'
    $content = $content -replace 'bg-slate-900', 'bg-card dark:bg-slate-900'
    
    # Background colors - red (destructive)
    $content = $content -replace 'bg-red-50/20', 'bg-destructive/10'
    $content = $content -replace 'bg-red-50', 'bg-destructive/10'
    $content = $content -replace 'bg-red-100', 'bg-destructive/20'
    $content = $content -replace 'bg-red-600', 'bg-destructive'
    $content = $content -replace 'bg-red-700', 'bg-destructive/90'
    
    # Background colors - green (primary for success)
    $content = $content -replace 'bg-green-50', 'bg-primary/10'
    $content = $content -replace 'bg-green-100', 'bg-primary/20'
    $content = $content -replace 'bg-green-500', 'bg-primary'
    $content = $content -replace 'bg-green-600', 'bg-primary'
    
    # Background colors - blue (primary)
    $content = $content -replace 'bg-blue-50', 'bg-primary/10'
    $content = $content -replace 'bg-blue-100', 'bg-primary/20'
    $content = $content -replace 'bg-blue-600', 'bg-primary'
    
    # Background colors - amber (accent)
    $content = $content -replace 'bg-amber-50', 'bg-accent'
    $content = $content -replace 'bg-amber-100', 'bg-accent'
    
    # Text colors - slate
    $content = $content -replace 'text-slate-400', 'text-muted-foreground'
    $content = $content -replace 'text-slate-500', 'text-muted-foreground'
    $content = $content -replace 'text-slate-600', 'text-muted-foreground'
    $content = $content -replace 'text-slate-700', 'text-foreground'
    $content = $content -replace 'text-slate-800', 'text-foreground'
    
    # Text colors - red (destructive)
    $content = $content -replace 'text-red-400', 'text-destructive'
    $content = $content -replace 'text-red-500', 'text-destructive'
    $content = $content -replace 'text-red-600', 'text-destructive'
    
    # Text colors - green (primary for success)
    $content = $content -replace 'text-green-400', 'text-primary'
    $content = $content -replace 'text-green-500', 'text-primary'
    $content = $content -replace 'text-green-600', 'text-primary'
    
    # Text colors - blue (primary)
    $content = $content -replace 'text-blue-400', 'text-primary'
    $content = $content -replace 'text-blue-500', 'text-primary'
    $content = $content -replace 'text-blue-600', 'text-primary'
    
    # Text colors - amber (accent)
    $content = $content -replace 'text-amber-400', 'text-accent-foreground'
    $content = $content -replace 'text-amber-500', 'text-accent-foreground'
    $content = $content -replace 'text-amber-600', 'text-accent-foreground'
    
    # Border colors
    $content = $content -replace 'border-slate-100', 'border-border'
    $content = $content -replace 'border-red-100', 'border-destructive/30'
    $content = $content -replace 'ring-red-100', 'ring-destructive/20'
    $content = $content -replace 'ring-red-200', 'ring-destructive/30'
    
    # Hover states
    $content = $content -replace 'hover:bg-red-700', 'hover:bg-destructive/90'
    $content = $content -replace 'hover:bg-green-700', 'hover:bg-primary/90'
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.FullName)"
}

Write-Host "Color refactoring complete!"
