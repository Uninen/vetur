import * as _ from 'lodash';

import { LanguageModelCache, getLanguageModelCache } from '../../embeddedSupport/languageModelCache';
import { TextDocument, Position, Range, FormattingOptions } from 'vscode-languageserver-types';
import { LanguageMode } from '../../embeddedSupport/languageModes';
import { VueDocumentRegions } from '../../embeddedSupport/embeddedSupport';
import { HTMLDocument } from './parser/htmlParser';
import { doComplete } from './services/htmlCompletion';
import { doHover } from './services/htmlHover';
import { findDocumentHighlights } from './services/htmlHighlighting';
import { findDocumentLinks } from './services/htmlLinks';
import { findDocumentSymbols } from './services/htmlSymbolsProvider';
import { htmlFormat } from './services/htmlFormat';
import { doESLintValidation, createLintEngine } from './services/htmlEslintValidation';
import { findDefinition } from './services/htmlDefinition';
import {
  getTagProviderSettings,
  IHTMLTagProvider,
  CompletionConfiguration,
  getEnabledTagProviders
} from './tagProviders';
import { DocumentContext } from '../../types';
import { VLSFormatConfig, VLSFullConfig } from '../../config';
import { VueInfoService } from '../../services/vueInfoService';
import { getComponentInfoTagProvider } from './tagProviders/componentInfoTagProvider';
import { VueVersion } from '../../services/typescriptService/vueVersion';
import { doPropValidation } from './services/vuePropValidation';
import { getFoldingRanges } from './services/htmlFolding';

export class HTMLMode implements LanguageMode {
  private tagProviderSettings: CompletionConfiguration;
  private enabledTagProviders: IHTMLTagProvider[];
  private embeddedDocuments: LanguageModelCache<TextDocument>;

  private config: VLSFullConfig;

  private lintEngine: any;

  constructor(
    documentRegions: LanguageModelCache<VueDocumentRegions>,
    workspacePath: string | undefined,
    vueVersion: VueVersion,
    private vueDocuments: LanguageModelCache<HTMLDocument>,
    private vueInfoService?: VueInfoService
  ) {
    this.tagProviderSettings = getTagProviderSettings(workspacePath);
    this.enabledTagProviders = getEnabledTagProviders(this.tagProviderSettings);
    this.embeddedDocuments = getLanguageModelCache<TextDocument>(10, 60, document =>
      documentRegions.refreshAndGet(document).getSingleLanguageDocument('vue-html')
    );
    this.lintEngine = createLintEngine(vueVersion);
  }

  getId() {
    return 'html';
  }

  configure(c: VLSFullConfig) {
    this.enabledTagProviders = getEnabledTagProviders(this.tagProviderSettings);
    this.config = c;
  }

  doValidation(document: TextDocument) {
    const diagnostics = [];

    const info = this.vueInfoService ? this.vueInfoService.getInfo(document) : undefined;
    if (info && info.componentInfo.childComponents) {
      diagnostics.push(...doPropValidation(document, this.vueDocuments.refreshAndGet(document), info));
    }

    if (this.config.vetur.validation.template) {
      const embedded = this.embeddedDocuments.refreshAndGet(document);
      diagnostics.push(...doESLintValidation(embedded, this.lintEngine));
    }

    return diagnostics;
  }
  doComplete(document: TextDocument, position: Position) {
    const embedded = this.embeddedDocuments.refreshAndGet(document);
    const tagProviders: IHTMLTagProvider[] = [...this.enabledTagProviders];

    const info = this.vueInfoService ? this.vueInfoService.getInfo(document) : undefined;
    if (info && info.componentInfo.childComponents) {
      tagProviders.push(getComponentInfoTagProvider(info.componentInfo.childComponents));
    }

    return doComplete(embedded, position, this.vueDocuments.refreshAndGet(embedded), tagProviders, this.config.emmet);
  }
  doHover(document: TextDocument, position: Position) {
    const embedded = this.embeddedDocuments.refreshAndGet(document);
    const tagProviders: IHTMLTagProvider[] = [...this.enabledTagProviders];

    return doHover(embedded, position, this.vueDocuments.refreshAndGet(embedded), tagProviders);
  }
  findDocumentHighlight(document: TextDocument, position: Position) {
    return findDocumentHighlights(document, position, this.vueDocuments.refreshAndGet(document));
  }
  findDocumentLinks(document: TextDocument, documentContext: DocumentContext) {
    return findDocumentLinks(document, documentContext);
  }
  findDocumentSymbols(document: TextDocument) {
    return findDocumentSymbols(document, this.vueDocuments.refreshAndGet(document));
  }
  format(document: TextDocument, range: Range, formattingOptions: FormattingOptions) {
    return htmlFormat(document, range, this.config.vetur.format as VLSFormatConfig);
  }
  findDefinition(document: TextDocument, position: Position) {
    const embedded = this.embeddedDocuments.refreshAndGet(document);
    const info = this.vueInfoService ? this.vueInfoService.getInfo(document) : undefined;
    return findDefinition(embedded, position, this.vueDocuments.refreshAndGet(embedded), info);
  }
  getFoldingRanges(document: TextDocument) {
    const embedded = this.embeddedDocuments.refreshAndGet(document);
    return getFoldingRanges(embedded);
  }
  onDocumentRemoved(document: TextDocument) {
    this.vueDocuments.onDocumentRemoved(document);
  }
  dispose() {
    this.vueDocuments.dispose();
  }
}
