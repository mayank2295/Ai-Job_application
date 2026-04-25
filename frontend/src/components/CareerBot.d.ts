import { FC } from 'react';

interface CareerBotProps {
  initialTab?: 'chat' | 'resume' | 'courses';
}

declare const CareerBot: FC<CareerBotProps>;
export default CareerBot;
