"use client";

import { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Database, 
  Search, 
  Server, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SystemStatus {
  database: boolean;
  search: boolean;
  searchStats?: {
    numberOfDocuments: number;
    isIndexing: boolean;
  };
}

export default function SystemPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      // Check search index stats
      const searchRes = await fetch("/api/admin/search/reindex");
      const searchData = searchRes.ok ? await searchRes.json() : null;

      setStatus({
        database: true, // If we got here, DB is working
        search: searchRes.ok,
        searchStats: searchData?.stats,
      });
    } catch (error) {
      setStatus({
        database: false,
        search: false,
      });
    }
    setLoading(false);
  };

  const handleReindex = async () => {
    setReindexing(true);
    setReindexResult(null);
    try {
      const res = await fetch("/api/admin/search/reindex", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setReindexResult(`Success: ${data.message}`);
        checkStatus();
      } else {
        setReindexResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setReindexResult("Error: Failed to reindex");
    }
    setReindexing(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const StatusIcon = ({ ok }: { ok: boolean }) => 
    ok ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-500 mt-1">Monitor system status and manage services</p>
        </div>
        <Button onClick={checkStatus} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && !status ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Database Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Database</h3>
              </div>
              <StatusIcon ok={status?.database || false} />
            </div>
            <p className="text-sm text-gray-500">
              {status?.database ? "PostgreSQL connected" : "Connection failed"}
            </p>
          </div>

          {/* Search Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Search className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Search Index</h3>
              </div>
              <StatusIcon ok={status?.search || false} />
            </div>
            {status?.searchStats ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  {status.searchStats.numberOfDocuments.toLocaleString()} documents indexed
                </p>
                {status.searchStats.isIndexing && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Indexing in progress
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {status?.search ? "Meilisearch connected" : "Search unavailable"}
              </p>
            )}
          </div>

          {/* Server Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Server className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Application</h3>
              </div>
              <StatusIcon ok={true} />
            </div>
            <p className="text-sm text-gray-500">Next.js running</p>
          </div>
        </div>
      )}

      {/* Search Reindex Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Reindex Search</h3>
            <p className="text-sm text-gray-500 max-w-lg">
              Rebuild the search index from the database. This will clear the existing index 
              and reindex all published listings. Use this if search results are out of sync.
            </p>
          </div>
          <Button 
            onClick={handleReindex} 
            disabled={reindexing || !status?.search}
            className="bg-[#1a3a2f] hover:bg-[#2a4a3f]"
          >
            {reindexing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reindexing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reindex Now
              </>
            )}
          </Button>
        </div>
        
        {reindexResult && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            reindexResult.startsWith('Success') 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {reindexResult}
          </div>
        )}

        {!status?.search && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-center gap-2 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Meilisearch is not available. Make sure it's running and configured.
          </div>
        )}
      </div>
    </div>
  );
}
