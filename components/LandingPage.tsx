
import React from 'react';

interface LandingCardProps {
  title: string;
  description: string;
  onClick?: () => void;
  variant?: 'white' | 'gray';
}

const LandingCard: React.FC<LandingCardProps> = ({ title, description, onClick, variant = 'white' }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        flex-1 border border-slate-200 rounded-2xl p-8 flex flex-col space-y-3 transition-all
        ${variant === 'gray' ? 'bg-slate-100 cursor-default' : 'bg-white cursor-pointer hover:shadow-lg hover:border-slate-300'}
      `}
    >
      <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
};

interface LandingPageProps {
  onSelectUserProfile: () => void;
  onSelectPeopleTab: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectUserProfile, onSelectPeopleTab }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white p-4">
      <div className="max-w-6xl w-full flex flex-col items-center">
        <h1 className="text-[28px] font-bold text-slate-900 mb-14 text-center">
          Send one-off documents with multiple signatures
        </h1>

        <div className="flex w-full max-w-5xl gap-6">
          <LandingCard 
            title="From people tab" 
            description="Send one-off documents From people tab in doc app" 
            onClick={onSelectPeopleTab}
          />
          <LandingCard 
            title="From template tab" 
            description="Does not apply, users have to create a template to send when in template tab" 
            variant="gray"
          />
          <LandingCard 
            title="From user’s profile" 
            description="Send one-off documents from user's profile" 
            onClick={onSelectUserProfile}
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
