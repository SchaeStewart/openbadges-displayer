import { Component, Prop, State } from "@stencil/core";
import { unbakeBadge } from "../../utils/utils";

@Component({
  tag: "openbadge-displayer",
  //   styleUrl: "my-component.css",
  shadow: true
})
export class OpenBadge {
  /**
   * The openbadge image
   */
  @Prop() src: string;

  @State() badge: object;
  @State() badgeDescription: string;

  async componentDidLoad() {
    this.badge = await unbakeBadge(this.src);
    this.getBadgeInformation(this.badge);
  }

  private async getBadgeInformation(badge: any) {
    const badgeInfo = await fetch(badge.badge).then(data => data.json());
    this.badgeDescription = badgeInfo.description;
  }

  render() {
    return (
      <div>
        <img src={this.src} />
        <span>{this.badge}</span>
        <span>Description: {this.badgeDescription}</span>
      </div>
    );
  }
}
