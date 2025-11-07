'use client';

/**
 * QC Report Component
 * Displays AI-generated quality control analysis
 */

import React from 'react';

interface QCReportProps {
  report: {
    depthMapQuality: number;
    segmentationAccuracy: number;
    audioQuality: number;
    overallScore: number;
    recommendations: string[];
  };
  metadata: {
    confidence: number;
    issues: string[];
    tags: string[];
    duration: number;
    dimensions: { width: number; height: number };
  };
  files: {
    bgLayer: string;
    mgLayer?: string;
    fgLayer?: string;
    audioFile?: string;
    depthMap?: string;
  };
}

export default function QCReport({ report, metadata, files }: QCReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Good';
    if (score >= 0.6) return 'Fair';
    return 'Needs Improvement';
  };

  const qualityMetrics = [
    {
      name: 'Depth Map Quality',
      score: report.depthMapQuality,
      description: 'Quality of depth information for 3D effects'
    },
    {
      name: 'Segmentation Accuracy', 
      score: report.segmentationAccuracy,
      description: 'Accuracy of object/character segmentation'
    },
    {
      name: 'Audio Quality',
      score: report.audioQuality,
      description: 'Audio clarity, levels, and technical quality'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">AI Quality Control Report</h2>
        <p className="text-sm text-gray-600">
          Automated analysis of asset quality and technical specifications
        </p>
      </div>

      {/* Overall Score */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Overall Quality Score</h3>
            <p className="text-sm text-gray-600">Combined assessment of all quality metrics</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.overallScore)}`}>
              {Math.round(report.overallScore * 100)}% - {getScoreLabel(report.overallScore)}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                report.overallScore >= 0.8 ? 'bg-green-500' : 
                report.overallScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${report.overallScore * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Metrics</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {qualityMetrics.map((metric) => (
            <div key={metric.name} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getScoreColor(metric.score)}`}>
                  {Math.round(metric.score * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{metric.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    metric.score >= 0.8 ? 'bg-green-500' : 
                    metric.score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metric.score * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Specifications</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
              <dd className="text-sm text-gray-900">{metadata.dimensions.width} × {metadata.dimensions.height}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="text-sm text-gray-900">{metadata.duration} seconds</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">AI Confidence</dt>
              <dd className="text-sm text-gray-900">{Math.round(metadata.confidence * 100)}%</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Files Provided</dt>
              <dd className="text-sm text-gray-900">
                {Object.entries(files).filter(([_, url]) => url).length} files
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* File Analysis */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">File Analysis</h3>
        <div className="space-y-3">
          {Object.entries(files).map(([type, url]) => {
            if (!url) return null;
            
            const fileTypes = {
              bgLayer: { name: 'Background Layer', icon: '🖼️', required: true },
              mgLayer: { name: 'Middle Ground Layer', icon: '🎨', required: false },
              fgLayer: { name: 'Foreground Layer', icon: '👤', required: false },
              audioFile: { name: 'Audio Track', icon: '🎵', required: false },
              depthMap: { name: 'Depth Map', icon: '📏', required: false }
            };
            
            const fileInfo = fileTypes[type as keyof typeof fileTypes];
            
            return (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-lg mr-3">{fileInfo.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fileInfo.name}</p>
                    <p className="text-xs text-gray-500">
                      {fileInfo.required ? 'Required' : 'Optional'} • Available
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    ✓ Valid
                  </span>
                  <button className="text-blue-600 hover:text-blue-500 text-sm">
                    Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Recommendations</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-blue-800">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Issues */}
      {metadata.issues.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issues Detected</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <ul className="space-y-2">
              {metadata.issues.map((issue, index) => (
                <li key={index} className="flex items-center">
                  <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs mr-3">
                    !
                  </span>
                  <span className="text-sm text-red-800">{issue.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI-Generated Tags</h3>
        <div className="flex flex-wrap gap-2">
          {metadata.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}