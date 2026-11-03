import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, CheckCircle2, XCircle, Building2, Phone } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { checkServiceabilityApi } from '../../api/branchApi';

export const ServiceabilityCheckerPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [submittedPincode, setSubmittedPincode] = useState('');

  const { data, isLoading, isFetched } = useQuery({
    queryKey: ['serviceability', submittedPincode],
    queryFn: () => checkServiceabilityApi(submittedPincode),
    enabled: !!submittedPincode,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSubmittedPincode(searchInput.trim().toUpperCase());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-3">
          <MapPin className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Delivery Serviceability Checker</h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Verify whether LogiFlows logistics hubs and courier partner branches service your delivery destination postal code.
        </p>
      </div>

      <Card className="p-6 mb-8 max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter postal code (e.g. 110006, 400001)..."
              className="font-mono uppercase text-sm"
            />
          </div>
          <Button type="submit" variant="primary" disabled={isLoading || !searchInput.trim()}>
            <Search className="w-4 h-4 mr-1.5" /> Check
          </Button>
        </form>
      </Card>

      {/* Results */}
      {isFetched && data && (
        <div className="max-w-2xl mx-auto">
          {data.is_serviceable ? (
            <Card className="p-6 border-emerald-800/60 bg-emerald-950/20 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-700/60">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Postal Code {data.postal_code} is Serviceable!
                  </h3>
                  <p className="text-xs text-emerald-300">
                    {data.match_count} active logistics provider(s) operate delivery routes to this area.
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {data.providers.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        {p.organization.name}
                        <code className="text-2xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {p.organization.code}
                        </code>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Operating Hub: <strong className="text-slate-300">{p.branch.name}</strong> ({p.branch.code}) • {p.branch.city}, {p.branch.state}
                      </div>
                    </div>
                    {p.branch.contact_phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {p.branch.contact_phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-amber-800/60 bg-amber-950/20 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-400 mx-auto mb-3 border border-amber-700/50">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Postal Code {data.postal_code} is Currently Not Serviceable
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active delivery branches currently declare coverage for this postal code. Please check back as our branch network expands.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceabilityCheckerPage;

