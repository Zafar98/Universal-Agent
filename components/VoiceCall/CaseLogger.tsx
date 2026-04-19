// Case logger display component
"use client";

interface CaseData {
  id: string;
  issueType: string;
  description: string;
  location: string;
  postcode: string;
  dateOfBirth: string;
  timestamp: Date;
  status: string;
}

interface CaseLoggerProps {
  caseData: CaseData | null;
}

export function CaseLogger({ caseData }: CaseLoggerProps) {
  if (!caseData) {
    return null;
  }

  return (
    <div className="border-2 border-green-500 rounded-lg bg-green-50 p-4 space-y-3">
      <div className="font-bold text-green-700 text-lg">✓ Case Logged Successfully</div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="font-semibold text-gray-700">Case ID</div>
          <div className="text-gray-600">{caseData.id}</div>
        </div>

        <div>
          <div className="font-semibold text-gray-700">Issue Type</div>
          <div className="text-gray-600 capitalize">{caseData.issueType}</div>
        </div>

        <div>
          <div className="font-semibold text-gray-700">Postcode</div>
          <div className="text-gray-600">{caseData.postcode}</div>
        </div>

        <div>
          <div className="font-semibold text-gray-700">Date of Birth</div>
          <div className="text-gray-600">{caseData.dateOfBirth}</div>
        </div>

        <div>
          <div className="font-semibold text-gray-700">Location</div>
          <div className="text-gray-600 capitalize">{caseData.location}</div>
        </div>

        <div>
          <div className="font-semibold text-gray-700">Timestamp</div>
          <div className="text-gray-600">
            {new Date(caseData.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      <div>
        <div className="font-semibold text-gray-700 mb-1">Description</div>
        <div className="bg-white p-2 rounded text-gray-600 text-sm border border-gray-200">
          {caseData.description}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-700">
        Case ID {caseData.id} has been saved to the system.
      </div>
    </div>
  );
}
