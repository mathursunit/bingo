
import React from 'react';
import { cn } from '../../lib/utils';
import { useSettings } from '../../contexts/SettingsContext';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
    const { settings } = useSettings();
    const isLightTheme = settings.theme === 'light';

    return (
        <div
            className={cn(
                "animate-pulse rounded-lg",
                isLightTheme
                    ? "bg-slate-200"
                    : "bg-white/5",
                className
            )}
            {...props}
        />
    );
};
