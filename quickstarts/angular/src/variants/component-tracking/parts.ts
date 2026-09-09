// The components the component-tracking.mdx templates reference but never define:
// `articles-list`, `app-footer` (:50-51) and `app-icon`, `app-button` (:128, :131).
import { Component } from "@angular/core";

@Component({ selector: "articles-list", template: `<ul id="articles"><li>one</li></ul>` })
export class ArticlesListComponent {}

@Component({ selector: "app-footer", template: `<footer id="footer">footer</footer>` })
export class FooterComponent {}

@Component({ selector: "app-icon", template: `<i><ng-content /></i>` })
export class IconComponent {}

@Component({ selector: "app-button", template: `<button><ng-content /></button>` })
export class ButtonComponent {}
