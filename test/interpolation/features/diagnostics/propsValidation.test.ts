import * as vscode from 'vscode';
import { testDiagnostics } from '../../../diagnosticHelper';
import { getDocUri } from '../../path';
import { sameLineRange } from '../../../util';

describe('Should find common diagnostics for all regions', () => {
  const parentUri = getDocUri('diagnostics/propsValidation/parent.vue');

  it('shows warnings for passing wrong props to child component when using array props', async () => {
    const expectedDiagnostics: vscode.Diagnostic[] = [
      {
        message: '<array-child> misses props: foo, bar, b-az',
        severity: vscode.DiagnosticSeverity.Warning,
        range: sameLineRange(2, 4, 31)
      },
      {
        message: '<array-child> misses props: bar, b-az',
        severity: vscode.DiagnosticSeverity.Warning,
        range: sameLineRange(3, 4, 41)
      },
      {
        message: '<array-child> misses props: bar, b-az',
        severity: vscode.DiagnosticSeverity.Warning,
        range: sameLineRange(4, 4, 42)
      },
      {
        message: '<array-child> misses props: b-az',
        severity: vscode.DiagnosticSeverity.Warning,
        range: sameLineRange(5, 4, 70)
      },
      {
        message: '<array-child> misses props: b-az',
        severity: vscode.DiagnosticSeverity.Warning,
        range: sameLineRange(8, 4, 64)
      },
      {
        message: '<ArrayChild> misses props: foo, bar, b-az',
        severity: vscode.DiagnosticSeverity.Warning,
        range: sameLineRange(9, 4, 18)
      },
      {
        message: '<ArrayChild> misses props: foo, bar, b-az',
        severity: vscode.DiagnosticSeverity.Warning,
        range: sameLineRange(10, 4, 29)
      }
    ];

    await testDiagnostics(parentUri, expectedDiagnostics);
  });

  it('shows warnings for passing wrong props to child component when using simple validators', async () => {
    const expectedDiagnostics: vscode.Diagnostic[] = [
      {
        message: '<simple-validator-child> misses props: foo, bar',
        severity: vscode.DiagnosticSeverity.Warning,
        range: sameLineRange(11, 4, 30)
      }
    ];

    await testDiagnostics(parentUri, expectedDiagnostics);
  });

  it('shows errors for passing wrong props to child component when using object validators', async () => {
    const expectedDiagnostics: vscode.Diagnostic[] = [
      {
        message: '<object-validator-child> misses props: foo, bar',
        severity: vscode.DiagnosticSeverity.Error,
        range: sameLineRange(12, 4, 30)
      },
      {
        message: '<object-validator-child> misses props: bar',
        severity: vscode.DiagnosticSeverity.Error,
        range: sameLineRange(13, 4, 41)
      },
      {
        message: '<object-validator-child> misses props: foo',
        severity: vscode.DiagnosticSeverity.Error,
        range: sameLineRange(14, 4, 40)
      }
    ];

    await testDiagnostics(parentUri, expectedDiagnostics);
  });

  it('shows errors or warnings for passing wrong props to child component when using class component', async () => {
    const expectedDiagnostics: vscode.Diagnostic[] = [
      {
        message: '<class-child> misses props: bar, ear, far, name, checked, foo',
        severity: vscode.DiagnosticSeverity.Error,
        range: sameLineRange(15, 4, 19)
      },
      {
        message: '<class-child> misses props: bar, far, name, checked, foo',
        severity: vscode.DiagnosticSeverity.Error,
        range: sameLineRange(16, 4, 29)
      },
      {
        message: '<class-child> misses props: bar, far, name, foo',
        severity: vscode.DiagnosticSeverity.Warning,
        range: sameLineRange(17, 4, 45)
      }
    ];

    await testDiagnostics(parentUri, expectedDiagnostics);
  });
});
